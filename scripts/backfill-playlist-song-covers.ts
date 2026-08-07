/**
 * Backfill album covers for catalog/playlist songs that have neither
 * `song_image_url` nor `artist_image_url`, using the iTunes Search API.
 *
 * Usage:
 *   npx tsx scripts/backfill-playlist-song-covers.ts                 # dry-run
 *   npx tsx scripts/backfill-playlist-song-covers.ts --write         # persist
 *   npx tsx scripts/backfill-playlist-song-covers.ts --playlist=akiva
 *   npx tsx scripts/backfill-playlist-song-covers.ts --limit=50
 *   npx tsx scripts/backfill-playlist-song-covers.ts --all-public    # all public catalog songs
 *   npx tsx scripts/backfill-playlist-song-covers.ts --force         # overwrite existing song_image_url
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import type { Database } from '../src/types/db'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')
const ALL_PUBLIC = process.argv.includes('--all-public')
const PLAYLIST_SLUG = process.argv.find((a) => a.startsWith('--playlist='))?.split('=')[1]
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0)

const REQUEST_DELAY_MS = 1100
const MAX_RETRIES = 4

interface ItunesResult {
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl100?: string
}

interface SongRow {
  id: string
  title: string
  author: string | null
  song_image_url: string | null
  artist_image_url: string | null
  genre: string | null
}

const searchCache = new Map<string, ItunesResult[]>()

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function upscaleArtwork(url: string): string {
  return url
    .replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1')
    .replace(/\/\d+x\d+bb\.webp$/i, '/600x600bb.webp')
}

function normalizeForMatch(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[''`ʹʻʼ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Strip trailing "(version 2)" / Hebrew parentheses noise for search. */
function cleanTitleForSearch(title: string): string {
  return title
    .replace(/\s*\([^)]*version[^)]*\)\s*/gi, ' ')
    .replace(/\s*\([^)]*\)\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Hebrew title inside parentheses, useful as an alternate search term. */
function extractHebrewParenthetical(title: string): string | null {
  const match = title.match(/\(([^)]*[\u05D0-\u05EA][^)]*)\)/)
  return match ? match[1].trim() : null
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(' ')
    .filter((t) => t.length >= 2)
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(tokenize(a))
  const tb = new Set(tokenize(b))
  if (ta.size === 0 || tb.size === 0) return 0
  let hit = 0
  for (const t of Array.from(ta)) {
    if (tb.has(t)) hit++
  }
  return hit / Math.max(ta.size, tb.size)
}

/** True when every significant title token appears in the candidate. */
function titleTokensCovered(title: string, trackName: string): boolean {
  const titleTokens = tokenize(title).filter((t) => t.length >= 3)
  if (titleTokens.length === 0) {
    return tokenOverlap(trackName, title) >= 0.85
  }
  const track = new Set(tokenize(trackName))
  return titleTokens.every((t) => track.has(t))
}

function hasUsableAuthor(author: string): boolean {
  return tokenize(author).length > 0
}

/** Hebrew artist names rarely match Latin iTunes artistName; don't hard-reject those. */
function isMostlyHebrew(input: string): boolean {
  const letters = input.replace(/[^\p{L}]/gu, '')
  if (!letters) return false
  const hebrew = (letters.match(/[\u05D0-\u05EA]/g) || []).length
  return hebrew / letters.length >= 0.5
}

function scoreResult(
  result: ItunesResult,
  title: string,
  author: string,
  queryIncludedAuthor: boolean
): number {
  if (!result.artworkUrl100 || !result.trackName) return -1

  const trackScore = tokenOverlap(result.trackName, title)
  const artistScore = author
    ? tokenOverlap(result.artistName ?? '', author)
    : 0.5
  // Author sometimes lives only in the album title (compilations).
  const collectionAuthorScore = author
    ? tokenOverlap(result.collectionName ?? '', author)
    : 0
  const bestArtist = Math.max(artistScore, collectionAuthorScore * 0.8)

  if (trackScore === 0) return -1
  if (trackScore < 0.35) return -1

  // Latin author names: refuse same-title songs by another artist.
  if (
    hasUsableAuthor(author) &&
    !isMostlyHebrew(author) &&
    bestArtist < 0.35
  ) {
    return -1
  }

  // Hebrew authors don't transliterate; only trust hits from author+title search
  // (iTunes ranking already used the artist name in the query).
  if (isMostlyHebrew(author)) {
    if (!queryIncludedAuthor) return -1
    if (trackScore < 0.5) return -1
  }

  // Reject partial title collisions ("Buon Vento" vs "Buon Anno"), but allow
  // spelling variants when the artist match is strong ("Baruch" / "Boruch").
  if (!titleTokensCovered(title, result.trackName)) {
    if (!(trackScore >= 0.45 && bestArtist >= 0.5)) return -1
  }

  let score = trackScore * 55 + bestArtist * 45

  // Hebrew author + strong track hit: credit iTunes for combining author in the search.
  if (isMostlyHebrew(author) && trackScore >= 0.5) {
    score = trackScore * 65 + 20
  }

  // Prefer studio over karaoke/live covers when close.
  const collection = (result.collectionName ?? '').toLowerCase()
  if (/karaoke|instrumental|tribute|cover version/.test(collection)) score -= 25
  if (/\blive\b|campfire/.test(collection)) score -= 8

  // Need confidence to avoid wrong album art on popular short titles.
  if (score < 50) return -1

  return score
}

async function searchItunes(term: string, country: string): Promise<ItunesResult[]> {
  const cacheKey = `${country}|${term}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term
  )}&entity=song&limit=12&country=${country}`

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await sleep(REQUEST_DELAY_MS)
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      })
      if (res.status === 403 || res.status === 429) {
        const backoff = REQUEST_DELAY_MS * (attempt + 2) + Math.floor(Math.random() * 500)
        console.log(`    … rate-limited ${res.status}, wait ${backoff}ms`)
        await sleep(backoff)
        continue
      }
      if (!res.ok) {
        searchCache.set(cacheKey, [])
        return []
      }
      const text = await res.text()
      if (!text.trim()) {
        await sleep(REQUEST_DELAY_MS * 2)
        continue
      }
      const json = JSON.parse(text) as { results?: ItunesResult[] }
      const results = json.results ?? []
      searchCache.set(cacheKey, results)
      return results
    } catch {
      await sleep(REQUEST_DELAY_MS * (attempt + 1))
    }
  }

  searchCache.set(cacheKey, [])
  return []
}

async function findCover(
  title: string,
  author: string | null
): Promise<{ artwork: string; track: string; artist: string; album: string; score: number } | null> {
  const cleanTitle = cleanTitleForSearch(title)
  const authorPart = (author ?? '').trim()
  const prefersIl = isMostlyHebrew(cleanTitle) || isMostlyHebrew(authorPart)

  // Minimize API calls: author+title first (required for Hebrew artists),
  // then title-only for latin / unmatched cases.
  const primaryCountry = prefersIl ? 'IL' : 'US'
  const fallbackCountry = prefersIl ? 'US' : 'IL'
  const queries: Array<{ term: string; country: string; withAuthor: boolean }> = []

  if (authorPart) {
    queries.push({
      term: `${authorPart} ${cleanTitle}`,
      country: primaryCountry,
      withAuthor: true,
    })
    queries.push({
      term: `${authorPart} ${cleanTitle}`,
      country: fallbackCountry,
      withAuthor: true,
    })
    const hebrewTitle = extractHebrewParenthetical(title)
    if (hebrewTitle && hebrewTitle !== cleanTitle) {
      queries.push({
        term: `${authorPart} ${hebrewTitle}`,
        country: 'IL',
        withAuthor: true,
      })
    }
  }

  // Title-only only when author is latin/missing (Hebrew same-title is too ambiguous).
  if (!authorPart || !isMostlyHebrew(authorPart)) {
    queries.push({ term: cleanTitle, country: primaryCountry, withAuthor: false })
    queries.push({ term: cleanTitle, country: fallbackCountry, withAuthor: false })
  }

  const seen = new Set<string>()
  const unique = queries.filter((q) => {
    const key = `${q.country}|${q.term}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let best: {
    artwork: string
    track: string
    artist: string
    album: string
    score: number
  } | null = null

  for (const q of unique) {
    // Once we already have a usable match, only keep trying if score is weak.
    if (best && best.score >= 70) break

    const results = await searchItunes(q.term, q.country)

    for (const r of results) {
      const score = scoreResult(r, cleanTitle, authorPart, q.withAuthor)
      if (score < 0) continue
      if (!r.artworkUrl100) continue
      if (!best || score > best.score) {
        best = {
          artwork: upscaleArtwork(r.artworkUrl100),
          track: r.trackName ?? '',
          artist: r.artistName ?? '',
          album: r.collectionName ?? '',
          score,
        }
      }
    }

    if (best && best.score >= 75) break
  }

  return best
}

async function loadTargetSongs(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<SongRow[]> {
  if (ALL_PUBLIC) {
    let query = (supabase.from('songs') as any)
      .select('id, title, author, song_image_url, artist_image_url, genre')
      .is('user_id', null)
      .eq('is_public', true)
      .order('title', { ascending: true })

    if (!FORCE) {
      query = query.is('song_image_url', null).is('artist_image_url', null)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as SongRow[]
  }

  // Default: songs that appear in public playlists
  let playlistQuery = (supabase.from('playlists') as any)
    .select('song_ids, curated_slug, name, is_public')
    .eq('is_public', true)

  if (PLAYLIST_SLUG) {
    playlistQuery = playlistQuery.eq('curated_slug', PLAYLIST_SLUG)
  }

  const { data: playlists, error: playlistError } = await playlistQuery
  if (playlistError) throw playlistError

  const songIds = new Set<string>()
  for (const p of playlists as Array<{ song_ids: string[] | null }>) {
    for (const id of p.song_ids ?? []) songIds.add(id)
  }

  if (songIds.size === 0) return []

  const ids = Array.from(songIds)
  const rows: SongRow[] = []
  const chunkSize = 200

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const { data, error } = await (supabase.from('songs') as any)
      .select('id, title, author, song_image_url, artist_image_url, genre')
      .in('id', chunk)
    if (error) throw error
    rows.push(...((data ?? []) as SongRow[]))
  }

  return rows.filter((s) => {
    if (FORCE) return true
    return !s.song_image_url && !s.artist_image_url
  })
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const modeLabel = [
    WRITE ? 'WRITE' : 'DRY-RUN',
    FORCE ? 'force' : null,
    ALL_PUBLIC ? 'all-public' : PLAYLIST_SLUG ? `playlist=${PLAYLIST_SLUG}` : 'public-playlists',
    LIMIT ? `limit=${LIMIT}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  console.log(`Mode: ${modeLabel}\n`)

  let songs = await loadTargetSongs(supabase)
  songs.sort((a, b) => a.title.localeCompare(b.title))

  if (LIMIT > 0) songs = songs.slice(0, LIMIT)

  console.log(`Target songs: ${songs.length}\n`)

  let matched = 0
  let missing = 0
  let skipped = 0
  let written = 0

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    const progress = `[${i + 1}/${songs.length}]`

    if (song.song_image_url && !FORCE) {
      skipped++
      console.log(`${progress} = ${song.title} — already has cover`)
      continue
    }

    try {
      const cover = await findCover(song.title, song.author)
      if (cover) {
        matched++
        console.log(
          `${progress} + ${song.title} — ${song.author ?? '?'}\n` +
            `    → ${cover.artist} / ${cover.track} (${cover.score.toFixed(0)})\n` +
            `    ${cover.artwork}`
        )
        if (WRITE) {
          const { error } = await (supabase.from('songs') as any)
            .update({
              song_image_url: cover.artwork,
              updated_at: new Date().toISOString(),
            })
            .eq('id', song.id)
          if (error) {
            console.error(`    ! write failed: ${error.message}`)
          } else {
            written++
            await revalidateSongCache(song.id)
          }
        }
      } else {
        missing++
        console.log(`${progress} ? ${song.title} — ${song.author ?? '?'} NO MATCH`)
      }
    } catch (err) {
      missing++
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`${progress} ! ${song.title} — error: ${msg}`)
    }
  }

  console.log(
    `\nSummary: ${matched} matched, ${missing} missing, ${skipped} skipped (of ${songs.length}).`
  )

  if (!WRITE) {
    console.log('\nDry-run only. Re-run with --write to persist.')
    return
  }

  console.log(`Done. Wrote ${written}/${matched} to DB.`)
}

run().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
