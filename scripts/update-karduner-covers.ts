/**
 * Fetch album/cover artwork for Yosef Karduner catalog songs from the iTunes
 * Search API and store the image URL in `songs.song_image_url`.
 *
 * Matching strategy: each catalog title carries the Hebrew name in parentheses
 * (e.g. "Mekimi (מקימי)"). We normalize the Hebrew (strip nikud/punctuation)
 * and match it against iTunes track names, then use that track's album artwork
 * (upscaled to 600x600). Unmatched songs optionally fall back to his signature
 * album cover.
 *
 * Usage:
 *   npx tsx scripts/update-karduner-covers.ts            # dry-run (no writes)
 *   npx tsx scripts/update-karduner-covers.ts --write    # persist to DB
 *   npx tsx scripts/update-karduner-covers.ts --write --fallback  # + fallback cover
 *   npx tsx scripts/update-karduner-covers.ts --force    # overwrite existing cover
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import type { Database } from '../src/types/db'
import { KARDUNER_AUTHOR } from '../src/data/catalogSongs/kardunerShared'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const WRITE = process.argv.includes('--write')
const USE_FALLBACK = process.argv.includes('--fallback')
const FORCE = process.argv.includes('--force')

interface ItunesResult {
  wrapperType?: string
  trackName?: string
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
}

/** Remove Hebrew niqqud/cantillation and any non-Hebrew-letter characters. */
function normalizeHebrew(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[\u0591-\u05C7]/g, '') // niqqud + cantillation marks
    .replace(/[^\u05D0-\u05EA]/g, '') // keep only Hebrew consonants
}

/** Latin-only / edge titles that carry no Hebrew in parentheses. */
const HEBREW_ALIASES: Record<string, string> = {
  mikimi: 'מקימי',
  shirlamaalot: 'שיר למעלות',
  shirhamaalot: 'שיר המעלות',
}

/** Extract the Hebrew part of a catalog title (text in parentheses if present). */
function extractHebrewTitle(title: string): string {
  const paren = title.match(/\(([^)]*[\u05D0-\u05EA][^)]*)\)/)
  if (paren) return paren[1]
  const latinKey = title.toLowerCase().replace(/[^a-z]/g, '')
  if (HEBREW_ALIASES[latinKey]) return HEBREW_ALIASES[latinKey]
  return title
}

/**
 * Resolve a normalized Hebrew key against the track map: exact match first,
 * then a substring match (either direction) requiring >= 4 shared Hebrew chars
 * to avoid false positives. Returns the longest overlapping candidate.
 */
function resolveMatch(key: string, trackMap: Map<string, Match>): Match | undefined {
  if (!key) return undefined
  const exact = trackMap.get(key)
  if (exact) return exact
  if (key.length < 4) return undefined
  let best: { match: Match; overlap: number } | undefined
  for (const [trackKey, match] of Array.from(trackMap)) {
    if (trackKey.length < 4) continue
    if (key.includes(trackKey) || trackKey.includes(key)) {
      const overlap = Math.min(key.length, trackKey.length)
      if (!best || overlap > best.overlap) best = { match, overlap }
    }
  }
  return best?.match
}

function upscaleArtwork(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1')
}

/** Lower score = preferred (studio albums over live/acapella). */
function collectionPenalty(collectionName = ''): number {
  const lower = collectionName.toLowerCase()
  let penalty = 0
  if (/live|campfire/.test(lower)) penalty += 10
  if (/acapella|a cappella|vocal|ווקאלי/.test(lower)) penalty += 5
  return penalty
}

async function fetchItunesSongs(country: string): Promise<ItunesResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    'Yosef Karduner'
  )}&entity=song&limit=200&country=${country}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes song search failed (${country}): ${res.status}`)
  const json = (await res.json()) as { results: ItunesResult[] }
  return json.results ?? []
}

async function fetchItunesSongsByTerm(hebrew: string): Promise<ItunesResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    `Yosef Karduner ${hebrew}`
  )}&entity=song&limit=10&country=IL`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = (await res.json()) as { results: ItunesResult[] }
  return json.results ?? []
}

async function fetchFallbackArtwork(): Promise<string | undefined> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    'Yosef Karduner'
  )}&entity=album&limit=30&country=US`
  const res = await fetch(url)
  if (!res.ok) return undefined
  const json = (await res.json()) as { results: ItunesResult[] }
  // Signature album: "סימנים בדרך / כל העולם" (Road Marks / The Whole World).
  const signature = json.results.find((r) =>
    /סימניםבדרך/.test(normalizeHebrew(r.collectionName ?? ''))
  )
  const chosen = signature ?? json.results[0]
  return chosen?.artworkUrl100 ? upscaleArtwork(chosen.artworkUrl100) : undefined
}

type Match = { artwork: string; album: string }

function buildTrackMap(results: ItunesResult[]): Map<string, Match> {
  const scored = new Map<string, { match: Match; penalty: number }>()
  for (const r of results) {
    if (!r.trackName || !r.artworkUrl100) continue
    if (r.artistName && !/karduner/i.test(r.artistName)) continue
    const key = normalizeHebrew(r.trackName)
    if (!key) continue
    const penalty = collectionPenalty(r.collectionName)
    const existing = scored.get(key)
    if (!existing || penalty < existing.penalty) {
      scored.set(key, {
        match: { artwork: upscaleArtwork(r.artworkUrl100), album: r.collectionName ?? '' },
        penalty,
      })
    }
  }
  const map = new Map<string, Match>()
  for (const [key, { match }] of Array.from(scored)) map.set(key, match)
  return map
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

  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY-RUN'}${USE_FALLBACK ? ' +fallback' : ''}${FORCE ? ' +force' : ''}\n`)

  const { data: songs, error } = await (supabase.from('songs') as any)
    .select('id, title, song_image_url')
    .eq('author', KARDUNER_AUTHOR)
    .order('title', { ascending: true })

  if (error) throw error
  if (!songs || songs.length === 0) {
    console.error(`No songs found for author "${KARDUNER_AUTHOR}". Seed the catalog first.`)
    process.exit(1)
  }

  console.log(`Found ${songs.length} "${KARDUNER_AUTHOR}" songs in DB.\n`)

  const [us, il] = await Promise.all([fetchItunesSongs('US'), fetchItunesSongs('IL')])
  const trackMap = buildTrackMap([...il, ...us])
  console.log(`iTunes: ${trackMap.size} distinct Hebrew tracks indexed.\n`)

  const fallback = USE_FALLBACK ? await fetchFallbackArtwork() : undefined

  let matched = 0
  let fallbackUsed = 0
  let skipped = 0
  let missing = 0
  const updates: { id: string; url: string }[] = []

  for (const song of songs as { id: string; title: string; song_image_url: string | null }[]) {
    if (song.song_image_url && !FORCE) {
      skipped++
      console.log(`= ${song.title}\n    (already has cover, use --force to overwrite)`)
      continue
    }

    const hebrew = extractHebrewTitle(song.title)
    const key = normalizeHebrew(hebrew)
    let match = resolveMatch(key, trackMap)

    if (!match && key) {
      // Targeted per-title lookup for anything missed by the bulk search.
      const targeted = await fetchItunesSongsByTerm(hebrew)
      const targetedMap = buildTrackMap(targeted)
      match = resolveMatch(key, targetedMap)
    }

    if (match) {
      matched++
      updates.push({ id: song.id, url: match.artwork })
      console.log(`+ ${song.title}\n    [${match.album}] ${match.artwork}`)
    } else if (fallback) {
      fallbackUsed++
      updates.push({ id: song.id, url: fallback })
      console.log(`~ ${song.title}\n    FALLBACK ${fallback}`)
    } else {
      missing++
      console.log(`? ${song.title}\n    NO MATCH (hebrew="${hebrew}")`)
    }
  }

  console.log(
    `\nSummary: ${matched} matched, ${fallbackUsed} fallback, ${skipped} skipped, ${missing} missing (of ${songs.length}).`
  )

  if (!WRITE) {
    console.log('\nDry-run only. Re-run with --write to persist.')
    return
  }

  console.log(`\nWriting ${updates.length} cover URLs to DB...`)
  const now = new Date().toISOString()
  for (const u of updates) {
    const { error: updateError } = await (supabase.from('songs') as any)
      .update({ song_image_url: u.url, updated_at: now })
      .eq('id', u.id)
    if (updateError) {
      console.error(`  ! failed ${u.id}: ${updateError.message}`)
      continue
    }
    await revalidateSongCache(u.id)
  }
  console.log('Done.')
}

run().catch((error) => {
  console.error('Update failed:', error)
  process.exit(1)
})
