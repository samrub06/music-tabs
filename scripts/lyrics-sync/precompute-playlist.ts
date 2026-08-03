/**
 * Precompute YouTube lyric sync for curated playlist, single song, or full public catalog.
 *
 * `--all-public` prioritizes songs in curated public playlists (explorer), then the rest
 * of the catalog. Already-ready syncs are skipped.
 *
 * Usage:
 *   npx tsx scripts/lyrics-sync/precompute-playlist.ts --slug=ishay-ribo --limit=3
 *   npx tsx scripts/lyrics-sync/precompute-playlist.ts --song-id=UUID --lang=fr --video-id=8yOuNrT0dOw
 *   npx tsx scripts/lyrics-sync/precompute-playlist.ts --all-public --limit=50
 *   npx tsx scripts/lyrics-sync/precompute-playlist.ts --all-public --offset=50 --limit=50 --cleanup-audio
 *   npx tsx scripts/lyrics-sync/precompute-playlist.ts --all-public --dry-run
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
  appendFileSync,
} from 'node:fs'
import path from 'node:path'
import { searchFirstEmbeddableTutorial } from '../../src/lib/services/youtubeService'
import { lyricSyncRepo } from '../../src/lib/services/lyricSyncRepo'
import { buildYoutubeOriginalQuery } from '../../src/utils/youtubeTutorial'
import { extractLyricLinesFromSections } from '../../src/utils/lyricSync'
import {
  writeLyricSyncFileCache,
  readLyricSyncFileCache,
} from '../../src/lib/services/lyricSyncFileCache'
import { containsHebrew } from '../../src/utils/rtl'
import type { Database } from '../../src/types/db'
import type { SongSection, LyricSyncLine } from '../../src/types'

dotenv.config({ path: '.env.local' })

const ROOT = process.cwd()
const AUDIO_DIR = path.join(ROOT, 'experiments/lyric-sync/audio')
const REPORT_PATH = path.join(ROOT, 'experiments/lyric-sync/precompute-report.jsonl')
const VENV_PYTHON = path.join(ROOT, 'experiments/beau-papa/.venv/bin/python')
const EXTRACT_SH = path.join(ROOT, 'scripts/lyrics-sync/extract_audio.sh')
const ALIGN_PY = path.join(ROOT, 'scripts/lyrics-sync/align_lyrics.py')
const PAGE_SIZE = 100

type Lang = 'he' | 'fr' | 'en'
type Outcome = 'ready' | 'skipped' | 'failed' | 'no-video' | 'no-lyrics' | 'dry-run'

type SongRow = {
  id: string
  title: string
  author: string | null
  sections: unknown
}

type Counters = Record<Outcome, number>

function parseArgs() {
  const allPublic = process.argv.includes('--all-public')
  const dryRun = process.argv.includes('--dry-run')
  const cleanupAudio = process.argv.includes('--cleanup-audio')
  const force = process.argv.includes('--force')
  const slug =
    process.argv.find((a) => a.startsWith('--slug='))?.slice('--slug='.length) || 'ishay-ribo'
  const songId = process.argv.find((a) => a.startsWith('--song-id='))?.slice('--song-id='.length)
  const videoId = process.argv.find((a) => a.startsWith('--video-id='))?.slice('--video-id='.length)
  const langRaw = process.argv.find((a) => a.startsWith('--lang='))?.slice('--lang='.length) as
    | Lang
    | undefined
  const limitRaw = process.argv.find((a) => a.startsWith('--limit='))?.slice('--limit='.length)
  const offsetRaw = process.argv.find((a) => a.startsWith('--offset='))?.slice('--offset='.length)
  const defaultLimit = allPublic ? 50 : 3
  const limit = limitRaw ? Number(limitRaw) : defaultLimit
  const offset = offsetRaw ? Number(offsetRaw) : 0

  return {
    allPublic,
    dryRun,
    cleanupAudio,
    force,
    slug,
    songId,
    videoId,
    langOverride: langRaw && ['he', 'fr', 'en'].includes(langRaw) ? langRaw : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : defaultLimit,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
  }
}

function detectSongLang(song: SongRow, lyricTexts: string[]): Lang {
  const blob = [song.title, song.author || '', ...lyricTexts].join(' ')
  if (containsHebrew(blob)) return 'he'
  // International / English catalog — Whisper `en` aligns better than `fr`
  return 'en'
}

function emptyCounters(): Counters {
  return {
    ready: 0,
    skipped: 0,
    failed: 0,
    'no-video': 0,
    'no-lyrics': 0,
    'dry-run': 0,
  }
}

function appendReport(row: Record<string, unknown>) {
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  appendFileSync(REPORT_PATH, `${JSON.stringify({ ...row, at: new Date().toISOString() })}\n`, 'utf8')
}

function cleanupStemAudio(stem: string) {
  for (const suffix of ['.wav', '.lyrics.json', '.transcript.json', '.aligned.json']) {
    const file = path.join(AUDIO_DIR, `${stem}${suffix}`)
    if (!existsSync(file)) continue
    try {
      unlinkSync(file)
    } catch {
      // ignore
    }
  }
}

/** Unique song IDs from curated explorer playlists, in display_order then playlist order. */
async function fetchCuratedPublicPlaylistSongIds(
  db: SupabaseClient<Database>
): Promise<string[]> {
  const client = db as any
  const { data, error } = await client
    .from('playlists')
    .select('song_ids, display_order, curated_slug, name')
    .eq('is_public', true)
    .not('curated_slug', 'is', null)
    .order('display_order', { ascending: true, nullsFirst: false })

  if (error) throw error

  const seen = new Set<string>()
  const ordered: string[] = []
  for (const row of data || []) {
    for (const id of (row.song_ids || []) as string[]) {
      if (!id || seen.has(id)) continue
      seen.add(id)
      ordered.push(id)
    }
  }
  return ordered
}

async function fetchSongsByIdsPreserveOrder(
  db: SupabaseClient<Database>,
  ids: string[]
): Promise<SongRow[]> {
  if (ids.length === 0) return []
  const client = db as any
  const byId = new Map<string, SongRow>()

  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const chunk = ids.slice(i, i + PAGE_SIZE)
    const { data, error } = await client
      .from('songs')
      .select('id, title, author, sections')
      .in('id', chunk)
    if (error) throw error
    for (const row of (data || []) as SongRow[]) {
      byId.set(row.id, row)
    }
  }

  return ids.map((id) => byId.get(id)).filter((s): s is SongRow => Boolean(s))
}

/**
 * Catalog songs not in `excludeIds`, in created_at order.
 * `skip` is how many non-excluded songs to skip (for offset past playlist priority).
 */
async function fetchCatalogSongsExcluding(
  db: SupabaseClient<Database>,
  excludeIds: Set<string>,
  opts: { skip: number; limit: number }
): Promise<SongRow[]> {
  const client = db as any
  const collected: SongRow[] = []
  let skipped = 0
  let from = 0

  while (collected.length < opts.limit) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await client
      .from('songs')
      .select('id, title, author, sections')
      .or('is_public.eq.true,user_id.is.null')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)

    if (error) throw error
    const batch = (data || []) as SongRow[]
    if (batch.length === 0) break

    for (const song of batch) {
      if (excludeIds.has(song.id)) continue
      if (skipped < opts.skip) {
        skipped++
        continue
      }
      collected.push(song)
      if (collected.length >= opts.limit) break
    }

    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return collected
}

/**
 * Public catalog with curated playlist songs first (explorer), then the rest.
 * Offset/limit apply to this prioritized sequence.
 */
async function fetchAllPublicSongs(
  db: SupabaseClient<Database>,
  opts: { offset: number; limit: number }
): Promise<{ songs: SongRow[]; total: number; playlistPriorityCount: number }> {
  const client = db as any
  const countRes = await client
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .or('is_public.eq.true,user_id.is.null')
  if (countRes.error) throw countRes.error
  const totalCount = countRes.count ?? 0

  const priorityIds = await fetchCuratedPublicPlaylistSongIds(db)
  const prioritySet = new Set(priorityIds)
  const end = opts.offset + opts.limit
  const songs: SongRow[] = []

  if (opts.offset < priorityIds.length) {
    const fromPriority = priorityIds.slice(opts.offset, Math.min(end, priorityIds.length))
    songs.push(...(await fetchSongsByIdsPreserveOrder(db, fromPriority)))
  }

  const stillNeed = opts.limit - songs.length
  if (stillNeed > 0) {
    const catalogSkip = Math.max(0, opts.offset - priorityIds.length)
    songs.push(
      ...(await fetchCatalogSongsExcluding(db, prioritySet, {
        skip: catalogSkip,
        limit: stillNeed,
      }))
    )
  }

  return {
    songs,
    total: totalCount,
    playlistPriorityCount: priorityIds.length,
  }
}

async function processSong(
  repo: ReturnType<typeof lyricSyncRepo>,
  song: SongRow,
  opts: {
    langOverride?: Lang
    force: boolean
    videoId?: string
    cleanupAudio: boolean
    dryRun: boolean
  },
  counters: Counters
): Promise<Outcome> {
  const sections = (song.sections as unknown as SongSection[]) || []
  const lyricLines = extractLyricLinesFromSections(sections)
  if (lyricLines.length === 0) {
    console.warn(`Skip ${song.title}: no lyric lines`)
    counters['no-lyrics']++
    appendReport({ outcome: 'no-lyrics', songId: song.id, title: song.title })
    return 'no-lyrics'
  }

  const lang =
    opts.langOverride ?? detectSongLang(
      song,
      lyricLines.map((l) => l.text)
    )

  if (opts.dryRun) {
    console.log(`\n[dry-run] ${song.title} — lang=${lang} lines=${lyricLines.length}`)
    counters['dry-run']++
    appendReport({
      outcome: 'dry-run',
      songId: song.id,
      title: song.title,
      lang,
      lines: lyricLines.length,
    })
    return 'dry-run'
  }

  // Skip before YouTube search if any ready sync already exists for this song
  if (!opts.force) {
    const anyReady = await repo.getReadyBySongId(song.id).catch(() => null)
    if (anyReady?.status === 'ready') {
      console.log(`\n→ ${song.title} — already ready (${anyReady.youtubeVideoId}), skip`)
      counters.skipped++
      appendReport({
        outcome: 'skipped',
        songId: song.id,
        title: song.title,
        youtubeVideoId: anyReady.youtubeVideoId,
        reason: 'song-already-ready',
      })
      return 'skipped'
    }
  }

  let video: { videoId: string; title: string; channelTitle: string } | null = null
  if (opts.videoId) {
    video = { videoId: opts.videoId, title: `(forced) ${opts.videoId}`, channelTitle: '' }
    console.log(`\n→ ${song.title} — forced video ${opts.videoId} (lang=${lang})`)
  } else {
    const query = buildYoutubeOriginalQuery(song.title, song.author || '', lang)
    console.log(`\n→ ${song.title} — search: ${query}`)
    try {
      video = await searchFirstEmbeddableTutorial(query, lang)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('  YouTube search failed:', message)
      counters.failed++
      appendReport({
        outcome: 'failed',
        songId: song.id,
        title: song.title,
        error: message,
      })
      // Abort the whole batch on daily quota — continuing just floods the report
      if (/429|quota|RATE_LIMIT|RESOURCE_EXHAUSTED/i.test(message)) {
        throw new Error(`YouTube quota exceeded — stop and resume tomorrow: ${message.slice(0, 200)}`)
      }
      return 'failed'
    }
  }

  if (!video) {
    console.warn('  No YouTube video found')
    await repo.markFailed(song.id, 'unknown', 'No YouTube video found').catch(() => null)
    counters['no-video']++
    appendReport({
      outcome: 'no-video',
      songId: song.id,
      title: song.title,
      lang,
    })
    return 'no-video'
  }
  console.log(`  video ${video.videoId} — ${video.title}`)

  const existing = await repo.getBySongAndVideo(song.id, video.videoId).catch(() => null)
  if (existing?.status === 'ready' && !opts.force) {
    console.log('  already ready in DB, skip (use --force to redo)')
    counters.skipped++
    appendReport({
      outcome: 'skipped',
      songId: song.id,
      title: song.title,
      youtubeVideoId: video.videoId,
      reason: 'db-ready',
    })
    return 'skipped'
  }

  const fileExisting = readLyricSyncFileCache(song.id, video.videoId)
  if (fileExisting?.status === 'ready' && !opts.force) {
    if (!existing || existing.status !== 'ready') {
      await repo
        .markReady({
          songId: song.id,
          youtubeVideoId: video.videoId,
          lines: fileExisting.lines,
          model: fileExisting.model || 'whisper-base',
        })
        .catch(() => null)
      console.log('  promoted file cache → DB, skip align')
    } else {
      console.log('  already ready in file cache, skip (use --force to redo)')
    }
    counters.skipped++
    appendReport({
      outcome: 'skipped',
      songId: song.id,
      title: song.title,
      youtubeVideoId: video.videoId,
      reason: 'file-cache-ready',
    })
    return 'skipped'
  }

  await repo.upsertPending(song.id, video.videoId).catch(() => null)

  const stem = `${song.id}_${video.videoId}`
  try {
    const wavPath = path.join(AUDIO_DIR, `${stem}.wav`)
    if (!existsSync(wavPath) || opts.force) {
      execFileSync('bash', [EXTRACT_SH, video.videoId, stem], {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, LYRIC_SYNC_OUT_DIR: AUDIO_DIR },
      })
    }

    const lyricsFile = path.join(AUDIO_DIR, `${stem}.lyrics.json`)
    const alignedPath = path.join(AUDIO_DIR, `${stem}.aligned.json`)
    writeFileSync(
      lyricsFile,
      JSON.stringify(
        {
          language: lang,
          lines: lyricLines.map(({ sectionIndex, lineIndex, text }) => ({
            sectionIndex,
            lineIndex,
            text,
          })),
        },
        null,
        2
      ),
      'utf8'
    )

    execFileSync(
      VENV_PYTHON,
      [
        ALIGN_PY,
        '--audio',
        wavPath,
        '--lyrics',
        lyricsFile,
        '--language',
        lang,
        '--out',
        alignedPath,
        ...(opts.force ? ['--retranscribe'] : []),
      ],
      { cwd: ROOT, stdio: 'inherit' }
    )

    const aligned = JSON.parse(readFileSync(alignedPath, 'utf8')) as {
      model?: string
      lines: LyricSyncLine[]
    }
    const timed = (aligned.lines || []).filter((l) => l.startSec != null).length
    if (timed === 0) {
      await repo.markFailed(song.id, video.videoId, 'Alignment produced 0 timed lines')
      console.warn('  failed: 0 timed lines')
      counters.failed++
      appendReport({
        outcome: 'failed',
        songId: song.id,
        title: song.title,
        youtubeVideoId: video.videoId,
        error: '0 timed lines',
      })
      return 'failed'
    }

    await repo
      .markReady({
        songId: song.id,
        youtubeVideoId: video.videoId,
        lines: aligned.lines,
        model: aligned.model || 'whisper-base',
      })
      .catch((err: unknown) => {
        console.warn('  DB upsert skipped (apply db/add-song-lyric-syncs.sql):', err)
      })

    writeLyricSyncFileCache({
      songId: song.id,
      youtubeVideoId: video.videoId,
      status: 'ready',
      lines: aligned.lines,
      model: aligned.model || 'whisper-base',
    })
    console.log(`  ready: ${timed}/${aligned.lines.length} timed lines`)

    if (opts.cleanupAudio) {
      cleanupStemAudio(stem)
      console.log('  cleaned local audio artifacts')
    }

    counters.ready++
    appendReport({
      outcome: 'ready',
      songId: song.id,
      title: song.title,
      youtubeVideoId: video.videoId,
      lang,
      timed,
      total: aligned.lines.length,
    })
    return 'ready'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('  failed:', message)
    await repo.markFailed(song.id, video.videoId, message).catch(() => null)
    counters.failed++
    appendReport({
      outcome: 'failed',
      songId: song.id,
      title: song.title,
      youtubeVideoId: video.videoId,
      error: message,
    })
    return 'failed'
  }
}

function printSummary(counters: Counters) {
  console.log('\n=== Summary ===')
  for (const [k, v] of Object.entries(counters)) {
    if (v > 0) console.log(`  ${k}: ${v}`)
  }
  console.log('Done.')
}

async function main() {
  const args = parseArgs()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  if (!process.env.YOUTUBE_API_KEY && !args.dryRun && !args.videoId) {
    throw new Error('Missing YOUTUBE_API_KEY')
  }
  if (!existsSync(VENV_PYTHON) && !args.dryRun) {
    throw new Error(
      `Missing Whisper venv at ${VENV_PYTHON}. Create experiments/beau-papa/.venv first.`
    )
  }

  mkdirSync(AUDIO_DIR, { recursive: true })
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as SupabaseClient<Database>
  const repo = lyricSyncRepo(supabase)
  const counters = emptyCounters()

  const processOpts = {
    langOverride: args.langOverride,
    force: args.force,
    videoId: args.videoId,
    cleanupAudio: args.cleanupAudio,
    dryRun: args.dryRun,
  }

  if (args.songId) {
    const { data: song, error: songErr } = await (supabase as any)
      .from('songs')
      .select('id, title, author, sections')
      .eq('id', args.songId)
      .single()
    if (songErr || !song) throw songErr || new Error(`Song not found: ${args.songId}`)
    console.log(`Single song: ${song.title}`)
    await processSong(repo, song, processOpts, counters)
    printSummary(counters)
    return
  }

  if (args.allPublic) {
    console.log(
      `Catalog --all-public (playlist-first) offset=${args.offset} limit=${args.limit}${args.dryRun ? ' (dry-run)' : ''}${args.cleanupAudio ? ' cleanup-audio' : ''}`
    )
    const { songs, total, playlistPriorityCount } = await fetchAllPublicSongs(supabase, {
      offset: args.offset,
      limit: args.limit,
    })
    const inPlaylistWindow =
      args.offset < playlistPriorityCount
        ? Math.min(songs.length, Math.max(0, playlistPriorityCount - args.offset))
        : 0
    console.log(
      `Loaded ${songs.length} songs (catalog total≈${total}; curated-playlist priority=${playlistPriorityCount}; this batch playlist=${inPlaylistWindow})`
    )

    for (const song of songs) {
      await processSong(repo, song, processOpts, counters)
    }
    printSummary(counters)
    console.log(`Report: ${REPORT_PATH}`)
    console.log(
      `Next batch: npm run lyrics-sync:precompute -- --all-public --offset=${args.offset + args.limit} --limit=${args.limit} --cleanup-audio`
    )
    return
  }

  const { data: playlist, error: plErr } = await (supabase as any)
    .from('playlists')
    .select('id, name, song_ids, curated_slug')
    .eq('curated_slug', args.slug)
    .eq('is_public', true)
    .maybeSingle()

  if (plErr) throw plErr
  if (!playlist) throw new Error(`No public playlist with curated_slug=${args.slug}`)

  const songIds = ((playlist.song_ids || []) as string[]).slice(
    args.offset,
    args.offset + args.limit
  )
  console.log(
    `Playlist ${playlist.name} (${args.slug}): processing ${songIds.length} songs (offset=${args.offset})`
  )

  for (const id of songIds) {
    const { data: song, error: songErr } = await (supabase as any)
      .from('songs')
      .select('id, title, author, sections')
      .eq('id', id)
      .single()

    if (songErr || !song) {
      console.warn(`Skip ${id}:`, songErr?.message)
      continue
    }

    await processSong(repo, song, processOpts, counters)
  }

  printSummary(counters)
  console.log(`Report: ${REPORT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
