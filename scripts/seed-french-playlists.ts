/**
 * Admin/ops: build Variété française + Rap FR from catalog matches.
 *
 * Usage:
 *   npm run seed:french-playlists -- --dry-run
 *   npm run seed:french-playlists
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { FRENCH_PLAYLISTS, type FrenchPlaylistDefinition } from '../src/data/frenchPlaylists'
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

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') }
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
  // Short needles (e.g. Jul, SCH, PNL, IAM) must be whole author tokens — never
  // substring of Olivia / Oliver / Julian / etc.
  if (n.length <= 4) {
    const tokens = a.split(/[^a-z0-9]+/).filter(Boolean)
    return tokens.includes(n)
  }
  // Longer names: allow "Francis Cabrel" matching needle "Cabrel", but require
  // needle as a full token (word boundary), not a random substring.
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
  definition: FrenchPlaylistDefinition
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
      misses.push(
        `${hit.titleIncludes ?? '*'} — ${hit.authorIncludes}`
      )
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
  definition: FrenchPlaylistDefinition,
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

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  const { dryRun } = parseArgs()
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Loading public catalog songs...')
  const catalog = await loadCatalogSongs(supabase)
  console.log(`Loaded ${catalog.length} catalog songs\n`)

  if (dryRun) console.log('(dry-run — no DB writes)\n')

  for (const definition of FRENCH_PLAYLISTS) {
    const { matched, softTagIds, misses } = resolvePlaylistSongs(catalog, definition)
    console.log(`=== ${definition.slug} ===`)
    console.log(`Matched ${matched.length} songs (cap ${MAX_SONGS_PER_PLAYLIST})`)
    for (const song of matched.slice(0, 25)) {
      console.log(`  + ${song.title} — ${song.author} [${song.genre ?? '∅'}]`)
    }
    if (matched.length > 25) {
      console.log(`  … +${matched.length - 25} more`)
    }
    if (misses.length > 0) {
      console.log(`Misses (${misses.length}):`)
      for (const m of misses.slice(0, 15)) console.log(`  ~ ${m}`)
      if (misses.length > 15) console.log(`  … +${misses.length - 15} more`)
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
  console.error('French playlist seed failed:', error)
  process.exit(1)
})
