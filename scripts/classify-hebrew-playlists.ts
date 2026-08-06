/**
 * Admin/ops one-shot: classify Negina + Tab4U hassidic dump songs into Hebrew playlists.
 *
 * Usage:
 *   npm run classify:hebrew-playlists -- --dry-run --limit=50
 *   npm run classify:hebrew-playlists
 *   npm run classify:hebrew-playlists -- --aggressive --tab4u-only
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { HEBREW_CATALOG_GENRES } from '../src/data/hebrewCatalogGenres'
import {
  classifyHebrewSongs,
  categoryToCatalogGenre,
  shouldApplyClassification,
  HEBREW_DUMP_GENRES,
  type HebrewSongToClassify,
} from '../src/lib/services/hebrewSongClassifierService'
import { rebuildHebrewPlaylistsFromGenres } from '../src/lib/services/hebrewPlaylistRebuildService'
import { isAIAvailable } from '../src/lib/config/ai'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const PAGE_SIZE = 500

function parseArgs() {
  let dryRun = false
  let aggressive = false
  let tab4uOnly = false
  let limit: number | undefined
  let offset = 0

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--aggressive') aggressive = true
    else if (arg === '--tab4u-only') tab4uOnly = true
    else if (arg.startsWith('--limit=')) {
      limit = Number.parseInt(arg.split('=')[1] ?? '', 10)
    } else if (arg.startsWith('--offset=')) {
      offset = Number.parseInt(arg.split('=')[1] ?? '', 10)
    }
  }

  return { dryRun, aggressive, tab4uOnly, limit, offset }
}

async function loadDumpSongs(
  client: ReturnType<typeof createClient<Database>>,
  offset: number,
  limit: number | undefined,
  genres: string[]
): Promise<HebrewSongToClassify[]> {
  const songs: HebrewSongToClassify[] = []
  let from = offset
  const hardCap = limit !== undefined ? offset + limit : Number.POSITIVE_INFINITY

  while (from < hardCap) {
    const to = Math.min(from + PAGE_SIZE - 1, hardCap - 1)
    const { data, error } = await (client.from('songs') as any)
      .select('id, title, author, genre')
      .in('genre', genres)
      .is('user_id', null)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) throw error
    const rows = (data ?? []) as {
      id: string
      title: string
      author: string
      genre: string | null
    }[]
    if (rows.length === 0) break

    for (const row of rows) {
      songs.push({
        id: row.id,
        title: row.title ?? '',
        author: row.author ?? '',
      })
    }

    if (rows.length < to - from + 1) break
    from += PAGE_SIZE
  }

  return songs
}

async function applyClassification(
  client: ReturnType<typeof createClient<Database>>,
  songId: string,
  genre: string,
  decade: number | null
): Promise<void> {
  const patch: Record<string, unknown> = {
    genre,
    updated_at: new Date().toISOString(),
  }
  if (decade != null) patch.decade = decade

  const { error } = await (client.from('songs') as any).update(patch).eq('id', songId)
  if (error) throw error
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  if (!isAIAvailable()) {
    console.warn(
      'Warning: OPENAI_API_KEY missing — only heuristic classifications will apply.\n'
    )
  }

  const { dryRun, aggressive, tab4uOnly, limit, offset } = parseArgs()
  // Include modern so new artist buckets (Hanan, Razel, Banai, Rand) can peel off
  // songs already tagged hebrew-modern.
  const genres = tab4uOnly
    ? [HEBREW_CATALOG_GENRES.tab4uHassidic]
    : [...HEBREW_DUMP_GENRES, HEBREW_CATALOG_GENRES.modern]

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Loading dump songs (${genres.join(' + ')})...`)
  if (aggressive) console.log('(aggressive mode: lower threshold + hassidic default)\n')
  const songs = await loadDumpSongs(supabase, offset, limit, genres)
  console.log(
    `Loaded ${songs.length} songs (offset=${offset}${limit != null ? `, limit=${limit}` : ''})\n`
  )

  if (songs.length === 0) {
    console.log('Nothing to classify.')
    process.exit(0)
  }

  if (dryRun) console.log('(dry-run — no DB writes)\n')

  let applied = 0
  let skipped = 0
  let errors = 0

  const applyOpts = { aggressive }
  const classifications = await classifyHebrewSongs(songs, {
    aggressive,
    onBatch: (batch) => {
      for (const c of batch) {
        const willApply = shouldApplyClassification(c, applyOpts)
        const genre = willApply
          ? categoryToCatalogGenre(c.category)
          : HEBREW_CATALOG_GENRES.tab4uHassidic
        const mark = willApply ? '→' : '~'
        console.log(
          `  ${mark} [${c.source}] ${c.category.padEnd(16)} conf=${c.confidence.toFixed(2)} decade=${c.decade ?? '-'}  ${genre}`
        )
        console.log(`      reason: ${c.reason}`)
      }
    },
  })

  const byId = new Map(songs.map((s) => [s.id, s]))
  console.log('\n--- Summary lines ---')
  for (const c of classifications) {
    const song = byId.get(c.id)
    const title = song ? `${song.title} — ${song.author}` : c.id
    const willApply = shouldApplyClassification(c, applyOpts)
    console.log(
      `${willApply ? 'APPLY' : 'KEEP '} ${c.category.padEnd(16)} ${c.confidence.toFixed(2)}  ${title}`
    )
  }

  if (!dryRun) {
    console.log('\nApplying updates...')
    for (const c of classifications) {
      try {
        if (!shouldApplyClassification(c, applyOpts)) {
          skipped += 1
          continue
        }
        const genre = categoryToCatalogGenre(c.category)
        await applyClassification(supabase, c.id, genre, c.decade)
        applied += 1
      } catch (error) {
        errors += 1
        const reason = error instanceof Error ? error.message : String(error)
        console.error(`  ✗ update ${c.id}: ${reason}`)
      }
    }

    console.log('\nRebuilding playlist memberships from genres...')
    const rebuilds = await rebuildHebrewPlaylistsFromGenres(supabase)
    for (const r of rebuilds) {
      console.log(
        `  ${r.action === 'created' ? '✅' : '🔄'} ${r.slug} (${r.songCount} songs) [${r.genre}]`
      )
    }

    try {
      const { revalidateTag, revalidatePath } = await import('next/cache')
      revalidateTag(LIBRARY_CATALOG_TAG)
      revalidatePath('/')
      console.log('\nCache revalidated.')
    } catch {
      console.log('\nHard-refresh the home page if playlists look stale.')
    }
  } else {
    applied = classifications.filter((c) =>
      shouldApplyClassification(c, applyOpts)
    ).length
    skipped = classifications.length - applied
  }

  console.log(
    `\nDone. applied=${applied} skipped=${skipped} errors=${errors} total=${classifications.length}`
  )
}

run().catch((error) => {
  console.error('Classify failed:', error)
  process.exit(1)
})
