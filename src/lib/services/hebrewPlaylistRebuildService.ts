/**
 * Admin/ops — rebuild curated Hebrew playlist song_ids from catalog genres.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { HEBREW_PLAYLISTS } from '@/data/hebrewPlaylists'
import {
  CLASSIFY_GENRE_TO_PLAYLIST_SLUG,
  HEBREW_DUMP_GENRES,
} from '@/lib/services/hebrewSongClassifierService'
import { HEBREW_CATALOG_GENRES, type HebrewCatalogGenre } from '@/data/hebrewCatalogGenres'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'
import type { Database } from '@/types/db'

const PAGE_SIZE = 1000

/** Playlists rebuilt after classify (buckets + artist + dump residues). */
export const CLASSIFY_REBUILD_SLUGS = [
  'chabad-nigunim',
  'hassidic',
  'jewish-liturgy',
  'yeshiva',
  'classic-israeli',
  'modern-israeli',
  'hanan-ben-ari',
  'aharon-razel',
  'eviatar-banai',
  'shuli-rand',
  'ishay-ribo',
  'yosef-karduner',
  'akiva',
  'carlebach',
  'jewish-songbook',
  'negina-jewish-music',
  'tab4u-hassidic-full',
] as const

async function fetchAllCatalogSongIdsForGenre(
  client: SupabaseClient<Database>,
  genre: HebrewCatalogGenre
): Promise<string[]> {
  const ids: string[] = []
  let from = 0

  while (true) {
    const { data, error } = await (client.from('songs') as any)
      .select('id')
      .eq('genre', genre)
      .is('user_id', null)
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const rows = (data ?? []) as { id: string }[]
    if (rows.length === 0) break
    for (const row of rows) ids.push(row.id)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return ids
}

async function upsertPlaylistSongIds(
  client: SupabaseClient<Database>,
  slug: string,
  songIds: string[]
): Promise<'created' | 'updated'> {
  const definition = HEBREW_PLAYLISTS.find((p) => p.slug === slug)
  if (!definition) {
    throw new Error(`Hebrew playlist definition not found: ${slug}`)
  }

  const now = new Date().toISOString()
  const row = {
    user_id: null,
    name: definition.name,
    description: definition.description,
    song_ids: songIds,
    is_public: true,
    curated_slug: definition.slug,
    display_order: definition.displayOrder,
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

export type PlaylistRebuildResult = {
  slug: string
  genre: HebrewCatalogGenre
  songCount: number
  action: 'created' | 'updated'
}

export async function rebuildHebrewPlaylistsFromGenres(
  client: SupabaseClient<Database>,
  slugs: readonly string[] = CLASSIFY_REBUILD_SLUGS
): Promise<PlaylistRebuildResult[]> {
  const results: PlaylistRebuildResult[] = []

  for (const slug of slugs) {
    const definition = HEBREW_PLAYLISTS.find((p) => p.slug === slug)
    if (!definition) continue

    const genre = definition.catalogGenre
    const songIds = await fetchAllCatalogSongIdsForGenre(client, genre)
    const action = await upsertPlaylistSongIds(client, slug, songIds)
    results.push({ slug, genre, songCount: songIds.length, action })
  }

  return results
}

export async function appendSongToGenrePlaylist(
  client: SupabaseClient<Database>,
  genre: HebrewCatalogGenre,
  songId: string
): Promise<void> {
  const slug = CLASSIFY_GENRE_TO_PLAYLIST_SLUG[genre]
  if (!slug) return

  const definition = HEBREW_PLAYLISTS.find((p) => p.slug === slug)
  if (!definition) return

  const { data: existing, error } = await (client.from('playlists') as any)
    .select('id, song_ids')
    .eq('curated_slug', slug)
    .maybeSingle()

  if (error) throw error

  const prev: string[] = existing?.song_ids ?? []
  if (prev.includes(songId)) return

  const songIds = [...prev, songId]
  await upsertPlaylistSongIds(client, slug, songIds)
}

export function isDumpGenre(genre: string): boolean {
  return (HEBREW_DUMP_GENRES as readonly string[]).includes(genre)
}

export { HEBREW_CATALOG_GENRES }
