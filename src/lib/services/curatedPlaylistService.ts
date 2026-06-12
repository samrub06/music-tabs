import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CURATED_PLAYLISTS,
  CURATED_PLAYLIST_SONG_LIMIT,
  type CuratedPlaylistDefinition,
  type CuratedPlaylistFilter,
} from '@/data/curatedPlaylists'
import type { Database } from '@/types/db'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'
import { dedupeCatalogSongs } from '@/lib/utils/catalogSongDedup'

type SongRow = {
  id: string
  title: string
  author: string
  source_url: string | null
  song_image_url: string | null
  artist_image_url: string | null
  view_count: number | null
  created_at: string
}

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') return false
  const pgError = error as { code?: string; message?: string }
  return pgError.code === '42703' && (pgError.message?.includes(column) ?? false)
}

async function fetchSongIdsForPlaylist(
  client: SupabaseClient<Database>,
  filter: CuratedPlaylistFilter
): Promise<SongRow[]> {
  let builder = (client.from('songs') as any)
    .select('id, title, author, source_url, song_image_url, artist_image_url, view_count, created_at')
    .or('is_public.eq.true,is_trending.eq.true')
    .is('user_id', null)

  if (filter.type === 'genre' || filter.type === 'hebrewCatalog') {
    builder = builder.eq('genre', filter.value)
  } else if (filter.type === 'decade') {
    builder = builder.eq('decade', filter.value)
  } else if (filter.type === 'difficultyIn') {
    builder = builder.in('difficulty', filter.values)
  } else {
    builder = builder.eq('difficulty', filter.value)
  }

  const { data, error } = await builder
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(CURATED_PLAYLIST_SONG_LIMIT)

  if (error) {
    const column =
      filter.type === 'genre' || filter.type === 'hebrewCatalog'
        ? 'genre'
        : filter.type === 'decade'
          ? 'decade'
          : 'difficulty'
    if (isMissingColumnError(error, column)) {
      console.warn(
        `[curated-playlists] Skipping filter on songs.${column} — run db/add-curated-playlists.sql (or db/add-genre-decade-fields.sql)`
      )
      return []
    }
    throw error
  }

  return dedupeCatalogSongs((data || []) as SongRow[])
}

function pickCoverImage(songs: SongRow[]): string | null {
  for (const song of songs) {
    if (song.song_image_url) return song.song_image_url
    if (song.artist_image_url) return song.artist_image_url
  }
  return null
}

export const curatedPlaylistService = (client: SupabaseClient<Database>) => ({
  async upsertCuratedPlaylist(definition: CuratedPlaylistDefinition) {
    const songs = await fetchSongIdsForPlaylist(client, definition.filter)
    const songIds = songs.map((s) => s.id)
    const imageUrl =
      definition.section === 'difficulty'
        ? null
        : getCuratedPlaylistCoverUrl(definition.slug) ?? pickCoverImage(songs)
    const now = new Date().toISOString()

    const row = {
      user_id: null,
      name: definition.name,
      description: definition.description,
      song_ids: songIds,
      is_public: true,
      curated_slug: definition.slug,
      display_order: definition.displayOrder,
      image_url: imageUrl,
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
      return { slug: definition.slug, songCount: songIds.length, action: 'updated' as const }
    }

    const { error } = await (client.from('playlists') as any).insert([
      { ...row, created_at: now },
    ])

    if (error) throw error
    return { slug: definition.slug, songCount: songIds.length, action: 'created' as const }
  },

  async seedAllCuratedPlaylists() {
    const results = []

    for (const definition of CURATED_PLAYLISTS) {
      if (definition.seedMode === 'manual') continue
      const result = await this.upsertCuratedPlaylist(definition)
      results.push(result)
    }

    return results
  },
})
