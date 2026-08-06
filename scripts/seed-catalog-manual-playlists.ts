/**
 * Admin/ops: build manual curated playlists from catalog matches
 * (French variety/rap + Acoustic + World Music).
 *
 * Usage:
 *   npm run seed:catalog-manual-playlists -- --dry-run
 *   npm run seed:catalog-manual-playlists
 *   npm run seed:catalog-manual-playlists -- --only=acoustic,world-music
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { FRENCH_PLAYLISTS } from '../src/data/frenchPlaylists'
import {
  ACOUSTIC_WORLD_PLAYLISTS,
  type CatalogManualPlaylistDefinition,
} from '../src/data/acousticPlaylists'
import { getCuratedPlaylistCoverUrl } from '../src/data/curatedPlaylistCoverImages'
import { CURATED_PLAYLISTS } from '../src/data/curatedPlaylists'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const PAGE_SIZE = 1000
const MAX_SONGS_PER_PLAYLIST = 80

type CatalogSong = {
  id: string
  title: string
  author: string
  genre: string | null
  view_count: number | null
}

type ManualDef = CatalogManualPlaylistDefinition

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run')
  const onlyRaw = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length)
  const only = onlyRaw
    ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : null
  return { dryRun, only }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function authorMatches(author: string, needle: string): boolean {
  const a = normalize(author)
  const n = normalize(needle)
  if (!n) return false
  if (a === n) return true
  if (n.length <= 4) {
    const tokens = a.split(/[^a-z0-9]+/).filter(Boolean)
    return tokens.includes(n)
  }
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(a)
}

function titleMatches(title: string, needle: string | undefined): boolean {
  if (!needle) return true
  return normalize(title).includes(normalize(needle))
}

async function loadCatalogSongs(
  client: ReturnType<typeof createClient<Database>>
): Promise<CatalogSong[]> {
  const songs: CatalogSong[] = []
  let from = 0

  while (true) {
    const { data, error } = await (client.from('songs') as any)
      .select('id, title, author, genre, view_count')
      .is('user_id', null)
      .or('is_public.eq.true,is_trending.eq.true')
      .order('view_count', { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const rows = (data ?? []) as CatalogSong[]
    if (rows.length === 0) break
    songs.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return songs
}

function resolvePlaylistSongs(
  catalog: CatalogSong[],
  definition: ManualDef
): { matched: CatalogSong[]; softTagIds: string[]; misses: string[] } {
  const byId = new Map<string, CatalogSong>()
  const misses: string[] = []

  for (const hit of definition.hits) {
    const found = catalog.find(
      (s) =>
        authorMatches(s.author ?? '', hit.authorIncludes) &&
        titleMatches(s.title ?? '', hit.titleIncludes)
    )
    if (found) {
      byId.set(found.id, found)
    } else {
      misses.push(`${hit.titleIncludes ?? '*'} — ${hit.authorIncludes}`)
    }
  }

  for (const artist of definition.artistAuthors) {
    for (const song of catalog) {
      if (byId.has(song.id)) continue
      if (authorMatches(song.author ?? '', artist)) {
        byId.set(song.id, song)
      }
    }
  }

  // World Music: also pull remaining UG world (195) + already-tagged world-music rows.
  if (definition.slug === 'world-music') {
    for (const song of catalog) {
      if (byId.has(song.id)) continue
      const g = song.genre ?? ''
      if (g === '195' || g === 'world-music') {
        byId.set(song.id, song)
      }
    }
  }

  const matched = Array.from(byId.values())
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, MAX_SONGS_PER_PLAYLIST)

  const softTagIds = matched
    .filter((s) => {
      const g = s.genre ?? ''
      return (
        !g ||
        definition.softTagFromGenres.includes(g) ||
        g === definition.catalogGenre
      )
    })
    .map((s) => s.id)

  return { matched, softTagIds, misses }
}

async function upsertPlaylist(
  client: ReturnType<typeof createClient<Database>>,
  definition: ManualDef,
  songIds: string[]
): Promise<'created' | 'updated'> {
  const curated = CURATED_PLAYLISTS.find((p) => p.slug === definition.slug)
  const now = new Date().toISOString()
  const row = {
    user_id: null,
    name: definition.name,
    description: definition.description,
    song_ids: songIds,
    is_public: true,
    curated_slug: definition.slug,
    display_order: curated?.displayOrder ?? definition.displayOrder,
    image_url: getCuratedPlaylistCoverUrl(definition.slug) ?? null,
    updated_at: now,
  }

  const { data: existing, error: existingError } = await (client.from('playlists') as any)
    .select('id')
    .eq('curated_slug', definition.slug)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { error } = await (client.from('playlists') as any)
      .update(row)
      .eq('id', existing.id)
    if (error) throw error
    return 'updated'
  }

  const { error } = await (client.from('playlists') as any).insert([
    { ...row, created_at: now },
  ])
  if (error) throw error
  return 'created'
}

async function softTagGenres(
  client: ReturnType<typeof createClient<Database>>,
  songIds: string[],
  genre: string
): Promise<number> {
  if (songIds.length === 0) return 0
  let updated = 0
  const chunk = 50
  for (let i = 0; i < songIds.length; i += chunk) {
    const ids = songIds.slice(i, i + chunk)
    const { error, count } = await (client.from('songs') as any)
      .update({ genre, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    updated += count ?? ids.length
  }
  return updated
}

function toManualDef(def: {
  slug: string
  name: string
  description: string
  displayOrder: number
  catalogGenre: string
  softTagFromGenres: string[]
  hits: { titleIncludes?: string; authorIncludes: string }[]
  artistAuthors: string[]
}): ManualDef {
  return def
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

  const { dryRun, only } = parseArgs()
  const all: ManualDef[] = [
    ...FRENCH_PLAYLISTS.map(toManualDef),
    ...ACOUSTIC_WORLD_PLAYLISTS,
  ]
  const definitions = only
    ? all.filter((d) => only.includes(d.slug))
    : all

  if (definitions.length === 0) {
    console.error(`No playlists matched --only=${only?.join(',')}`)
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Loading public catalog songs...')
  const catalog = await loadCatalogSongs(supabase)
  console.log(`Loaded ${catalog.length} catalog songs\n`)

  if (dryRun) console.log('(dry-run — no DB writes)\n')

  for (const definition of definitions) {
    const { matched, softTagIds, misses } = resolvePlaylistSongs(catalog, definition)
    console.log(`=== ${definition.slug} ===`)
    console.log(`Matched ${matched.length} songs (cap ${MAX_SONGS_PER_PLAYLIST})`)
    for (const song of matched.slice(0, 30)) {
      console.log(`  + ${song.title} — ${song.author} [${song.genre ?? '∅'}]`)
    }
    if (matched.length > 30) {
      console.log(`  … +${matched.length - 30} more`)
    }
    if (misses.length > 0) {
      console.log(`Misses (${misses.length}):`)
      for (const m of misses.slice(0, 12)) console.log(`  ~ ${m}`)
      if (misses.length > 12) console.log(`  … +${misses.length - 12} more`)
    }

    if (!dryRun) {
      const tagged = await softTagGenres(
        supabase,
        softTagIds,
        definition.catalogGenre
      )
      const action = await upsertPlaylist(
        supabase,
        definition,
        matched.map((s) => s.id)
      )
      console.log(
        `${action === 'created' ? '✅' : '🔄'} playlist ${definition.slug} (${matched.length} songs, soft-tagged ${tagged})\n`
      )
    } else {
      console.log(`Would soft-tag ${softTagIds.length} songs → ${definition.catalogGenre}\n`)
    }
  }

  if (!dryRun) {
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache')
      revalidateTag(LIBRARY_CATALOG_TAG)
      revalidatePath('/')
      console.log('Cache revalidated.')
    } catch {
      console.log('Hard-refresh the home page if playlists look stale.')
    }
  }

  console.log('Done.')
}

run().catch((error) => {
  console.error('Catalog manual playlist seed failed:', error)
  process.exit(1)
})
