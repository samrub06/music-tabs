import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HEBREW_PLAYLISTS,
  type HebrewCatalogGenre,
  type HebrewPlaylistDefinition,
} from '@/data/hebrewPlaylists'
import { upsertCatalogSongFromNegina } from '@/lib/services/catalogSongUpsert'
import { listNeginaGenreSongs } from '@/lib/services/scraperService'
import {
  classifyAndResolveGenre,
} from '@/lib/services/hebrewSongClassifierService'
import { appendSongToGenrePlaylist } from '@/lib/services/hebrewPlaylistRebuildService'
import type { Database } from '@/types/db'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'

const REQUEST_DELAY_MS = 600
const MAX_GENRE_PAGES = 39

export type NeginaPlaylistSeedOptions = {
  dryRun?: boolean
  maxSongs?: number
  startPage?: number
  skipExisting?: boolean
  playlistSlug?: string
  catalogGenre?: HebrewCatalogGenre
  /** Admin seed only: AI/heuristic classify after upsert (default true). */
  classify?: boolean
}

export type NeginaPlaylistSongResult =
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

export type NeginaPlaylistSeedResult = {
  slug: string
  songCount: number
  action: 'created' | 'updated'
  songs: NeginaPlaylistSongResult[]
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

async function upsertNeginaPlaylist(
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

export const neginaPlaylistSeedService = (client: SupabaseClient<Database>) => ({
  async seedNeginaJewishPlaylist(
    options: NeginaPlaylistSeedOptions = {}
  ): Promise<NeginaPlaylistSeedResult> {
    const slug = options.playlistSlug ?? 'negina-jewish-music'
    const definition = getPlaylistDefinition(slug)
    if (!definition) {
      throw new Error(`Playlist definition not found: ${slug}`)
    }

    const dumpGenre = options.catalogGenre ?? definition.catalogGenre
    const maxSongs = options.maxSongs
    const startPage = options.startPage ?? 1
    const shouldClassify = options.classify !== false

    const songResults: NeginaPlaylistSongResult[] = []
    const residueSongIds: string[] = []
    const seenUrls = new Set<string>()
    let processed = 0

    for (let page = startPage; page <= MAX_GENRE_PAGES; page += 1) {
      const entries = await listNeginaGenreSongs(page)
      if (entries.length === 0) break

      for (const entry of entries) {
        if (seenUrls.has(entry.url)) continue
        seenUrls.add(entry.url)

        if (maxSongs !== undefined && processed >= maxSongs) break

        try {
          if (options.skipExisting) {
            const existingId = await findExistingCatalogSongId(client, entry.url)
            if (existingId) {
              songResults.push({ status: 'skipped', reason: 'already in catalog', url: entry.url })
              processed += 1
              continue
            }
          }

          if (options.dryRun) {
            songResults.push({ status: 'skipped', reason: 'dry-run', url: entry.url })
            processed += 1
            continue
          }

          const result = {
            title: entry.title,
            author: entry.author,
            url: entry.url,
            source: 'Negina',
          }

          const { songId, action } = await upsertCatalogSongFromNegina(
            client,
            result,
            dumpGenre
          )

          let finalGenre: HebrewCatalogGenre = dumpGenre
          let category = 'unclassified'

          if (shouldClassify) {
            const resolved = await classifyAndResolveGenre(
              { id: songId, title: entry.title, author: entry.author },
              dumpGenre
            )
            category = resolved.classification.category
            finalGenre = resolved.genre
            if (resolved.applied) {
              await applySongGenreDecade(
                client,
                songId,
                finalGenre,
                resolved.decade
              )
              await appendSongToGenrePlaylist(client, finalGenre, songId)
            } else {
              residueSongIds.push(songId)
            }
          } else {
            residueSongIds.push(songId)
          }

          songResults.push({
            status: action,
            songId,
            title: entry.title,
            url: entry.url,
            genre: finalGenre,
            category,
          })
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          songResults.push({ status: 'error', reason, url: entry.url })
        }

        processed += 1
        await sleep(REQUEST_DELAY_MS)
      }

      if (maxSongs !== undefined && processed >= maxSongs) break
    }

    let action: 'created' | 'updated' = 'created'
    if (!options.dryRun && residueSongIds.length > 0) {
      action = await upsertNeginaPlaylist(client, definition, residueSongIds)
    } else if (
      !options.dryRun &&
      residueSongIds.length === 0 &&
      songResults.some((s) => s.status === 'added' || s.status === 'updated')
    ) {
      // Ensure residue playlist exists even if empty this run (merge noop)
      action = await upsertNeginaPlaylist(client, definition, [])
    }

    return {
      slug,
      songCount: residueSongIds.length,
      action,
      songs: songResults,
    }
  },
})
