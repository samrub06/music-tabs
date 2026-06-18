import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HEBREW_PLAYLISTS,
  type HebrewCatalogGenre,
  type HebrewPlaylistDefinition,
} from '@/data/hebrewPlaylists'
import { upsertCatalogSongFromTab4u } from '@/lib/services/catalogSongUpsert'
import { listTab4uCategorySongs, type SearchResult } from '@/lib/services/scraperService'
import type { Database } from '@/types/db'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'

const REQUEST_DELAY_MS = 600
const TAB4U_HASSIDIC_CAT = 1

export type Tab4uCategorySeedOptions = {
  cat?: number
  dryRun?: boolean
  maxSongs?: number
  startOffset?: number
  skipExisting?: boolean
  playlistSlug?: string
  catalogGenre?: HebrewCatalogGenre
}

export type Tab4uCategorySongResult =
  | { status: 'added'; songId: string; title: string; url: string }
  | { status: 'updated'; songId: string; title: string; url: string }
  | { status: 'skipped'; reason: string; url: string }
  | { status: 'error'; reason: string; url: string }

export type Tab4uCategorySeedResult = {
  slug: string
  songCount: number
  action: 'created' | 'updated'
  songs: Tab4uCategorySongResult[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPlaylistDefinition(slug: string): HebrewPlaylistDefinition | undefined {
  return HEBREW_PLAYLISTS.find((p) => p.slug === slug)
}

async function findExistingCatalogSongId(
  client: SupabaseClient<Database>,
  url: string
): Promise<string | null> {
  const { data } = await (client.from('songs') as any)
    .select('id')
    .eq('source_url', url)
    .is('user_id', null)
    .maybeSingle()
  return data?.id ?? null
}

async function upsertCategoryPlaylist(
  client: SupabaseClient<Database>,
  definition: HebrewPlaylistDefinition,
  songIds: string[]
): Promise<'created' | 'updated'> {
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
    .select('id, song_ids')
    .eq('curated_slug', definition.slug)
    .maybeSingle()

  if (existingError) throw existingError

  const mergedSongIds = Array.from(new Set([...(existing?.song_ids ?? []), ...songIds]))

  if (existing?.id) {
    const { error } = await (client.from('playlists') as any)
      .update({ ...row, song_ids: mergedSongIds })
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

async function seedCategorySong(
  client: SupabaseClient<Database>,
  result: SearchResult,
  catalogGenre: HebrewCatalogGenre,
  options: Tab4uCategorySeedOptions
): Promise<Tab4uCategorySongResult> {
  try {
    if (options.skipExisting) {
      const existingId = await findExistingCatalogSongId(client, result.url)
      if (existingId) {
        return { status: 'skipped', reason: 'already in catalog', url: result.url }
      }
    }

    if (options.dryRun) {
      return { status: 'skipped', reason: 'dry-run', url: result.url }
    }

    const { songId, action } = await upsertCatalogSongFromTab4u(client, result, catalogGenre)
    return { status: action, songId, title: result.title, url: result.url }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { status: 'error', reason, url: result.url }
  }
}

export const tab4uCategorySeedService = (client: SupabaseClient<Database>) => ({
  async seedTab4uCategory(options: Tab4uCategorySeedOptions = {}): Promise<Tab4uCategorySeedResult> {
    const slug = options.playlistSlug ?? 'tab4u-hassidic-full'
    const definition = getPlaylistDefinition(slug)
    if (!definition) {
      throw new Error(`Playlist definition not found: ${slug}`)
    }

    const catalogGenre = options.catalogGenre ?? definition.catalogGenre
    const cat = options.cat ?? TAB4U_HASSIDIC_CAT
    const maxSongs = options.maxSongs
    let offset = options.startOffset ?? 0

    const songResults: Tab4uCategorySongResult[] = []
    const songIds: string[] = []
    const seenUrls = new Set<string>()
    let processed = 0

    while (true) {
      const page = await listTab4uCategorySongs({ cat, offset })
      if (page.songs.length === 0) break

      for (const result of page.songs) {
        if (seenUrls.has(result.url)) continue
        seenUrls.add(result.url)

        if (maxSongs !== undefined && processed >= maxSongs) break

        const seedResult = await seedCategorySong(client, result, catalogGenre, options)
        songResults.push(seedResult)

        if (seedResult.status === 'added' || seedResult.status === 'updated') {
          songIds.push(seedResult.songId)
        }

        processed += 1
        await sleep(REQUEST_DELAY_MS)
      }

      if (maxSongs !== undefined && processed >= maxSongs) break
      if (page.nextOffset === undefined || page.nextOffset <= offset) break
      if (page.totalResults !== undefined && page.nextOffset >= page.totalResults) break

      offset = page.nextOffset
    }

    let action: 'created' | 'updated' = 'created'
    if (!options.dryRun && songIds.length > 0) {
      action = await upsertCategoryPlaylist(client, definition, songIds)
    }

    return {
      slug,
      songCount: songIds.length,
      action,
      songs: songResults,
    }
  },
})
