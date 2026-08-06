import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HEBREW_PLAYLISTS,
  type HebrewCatalogGenre,
  type HebrewPlaylistDefinition,
} from '@/data/hebrewPlaylists'
import { upsertCatalogSongFromTab4u } from '@/lib/services/catalogSongUpsert'
import { listTab4uCategorySongs, type SearchResult } from '@/lib/services/scraperService'
import { classifyAndResolveGenre } from '@/lib/services/hebrewSongClassifierService'
import { appendSongToGenrePlaylist } from '@/lib/services/hebrewPlaylistRebuildService'
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
  /** Admin seed only: AI/heuristic classify after upsert (default true). */
  classify?: boolean
}

export type Tab4uCategorySongResult =
  | {
      status: 'added'
      songId: string
      title: string
      url: string
      genre?: string
      category?: string
    }
  | {
      status: 'updated'
      songId: string
      title: string
      url: string
      genre?: string
      category?: string
    }
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

async function applySongGenreDecade(
  client: SupabaseClient<Database>,
  songId: string,
  genre: HebrewCatalogGenre,
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

async function seedCategorySong(
  client: SupabaseClient<Database>,
  result: SearchResult,
  dumpGenre: HebrewCatalogGenre,
  options: Tab4uCategorySeedOptions
): Promise<Tab4uCategorySongResult & { residue?: boolean }> {
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

    const { songId, action } = await upsertCatalogSongFromTab4u(client, result, dumpGenre)

    let finalGenre: HebrewCatalogGenre = dumpGenre
    let category = 'unclassified'
    let residue = true
    const shouldClassify = options.classify !== false

    if (shouldClassify) {
      const resolved = await classifyAndResolveGenre(
        {
          id: songId,
          title: result.title,
          author: result.author,
        },
        dumpGenre
      )
      category = resolved.classification.category
      finalGenre = resolved.genre
      if (resolved.applied) {
        await applySongGenreDecade(client, songId, finalGenre, resolved.decade)
        await appendSongToGenrePlaylist(client, finalGenre, songId)
        residue = false
      }
    }

    return {
      status: action,
      songId,
      title: result.title,
      url: result.url,
      genre: finalGenre,
      category,
      residue,
    }
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

    const dumpGenre = options.catalogGenre ?? definition.catalogGenre
    const cat = options.cat ?? TAB4U_HASSIDIC_CAT
    const maxSongs = options.maxSongs
    let offset = options.startOffset ?? 0

    const songResults: Tab4uCategorySongResult[] = []
    const residueSongIds: string[] = []
    const seenUrls = new Set<string>()
    let processed = 0

    while (true) {
      const page = await listTab4uCategorySongs({ cat, offset })
      if (page.songs.length === 0) break

      for (const result of page.songs) {
        if (seenUrls.has(result.url)) continue
        seenUrls.add(result.url)

        if (maxSongs !== undefined && processed >= maxSongs) break

        const seedResult = await seedCategorySong(client, result, dumpGenre, options)
        const { residue, ...publicResult } = seedResult as Tab4uCategorySongResult & {
          residue?: boolean
        }
        songResults.push(publicResult)

        if (
          (publicResult.status === 'added' || publicResult.status === 'updated') &&
          residue !== false
        ) {
          residueSongIds.push(publicResult.songId)
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
    if (!options.dryRun) {
      action = await upsertCategoryPlaylist(client, definition, residueSongIds)
    }

    return {
      slug,
      songCount: residueSongIds.length,
      action,
      songs: songResults,
    }
  },
})
