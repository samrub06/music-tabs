/**
 * Ops: popular tracks (web charts + AI research, NOT Spotify API)
 * → locale scrape → catalog upsert → curated playlist song_ids.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SPOTIFY_POPULAR_SOURCES,
  getSpotifyPopularSource,
  listConfiguredSpotifyPopularSources,
  type SpotifyPopularSource,
} from '@/data/spotifyPopularSources'
import { CURATED_PLAYLISTS } from '@/data/curatedPlaylists'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'
import { researchedTrackAllowedForSource } from '@/data/curatedPlaylistMembership'
import { researchPopularTracksForSource } from '@/lib/services/popularTracksResearchService'
import { searchTabsByLocale } from '@/lib/services/localeScrapeRouter'
import {
  upsertCatalogSongFromNegina,
  upsertCatalogSongFromTab4u,
  upsertCatalogSongFromUg,
} from '@/lib/services/catalogSongUpsert'
import type { Database } from '@/types/db'

const REQUEST_DELAY_MS = 800

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type PopularSeedTrackResult =
  | {
      status: 'added' | 'updated'
      title: string
      artist: string
      songId: string
      source: string
      locale: string
    }
  | {
      status: 'skipped' | 'error'
      title: string
      artist: string
      reason: string
    }

export type PopularSeedSourceSummary = {
  key: string
  targetSlug: string
  researchMethod: 'chart' | 'ai'
  playlistAction: 'created' | 'updated' | 'skipped'
  songCount: number
  added: number
  updated: number
  skipped: number
  errors: number
  results: PopularSeedTrackResult[]
}

export type PopularCatalogSeedOptions = {
  /** Filter by source key (e.g. top-israel). Default: all configured. */
  sourceKey?: string
  limit?: number
  dryRun?: boolean
  delayMs?: number
  onTrack?: (result: PopularSeedTrackResult) => void
}

async function upsertPlaylistSongIds(
  client: SupabaseClient<Database>,
  source: SpotifyPopularSource,
  songIds: string[],
  dryRun: boolean
): Promise<'created' | 'updated' | 'skipped'> {
  if (dryRun) return 'skipped'

  const curated = CURATED_PLAYLISTS.find((p) => p.slug === source.targetSlug)
  const now = new Date().toISOString()
  const row = {
    user_id: null,
    name: curated?.name ?? source.name,
    description: curated?.description ?? source.description ?? '',
    song_ids: songIds,
    is_public: true,
    curated_slug: source.targetSlug,
    display_order: curated?.displayOrder ?? 99,
    image_url: getCuratedPlaylistCoverUrl(source.targetSlug) ?? null,
    updated_at: now,
  }

  const { data: existing, error: existingError } = await (client.from('playlists') as any)
    .select('id, song_ids')
    .eq('curated_slug', source.targetSlug)
    .maybeSingle()

  if (existingError) throw existingError

  // Chart shelves: replace with researched popularity order.
  // Exception: Top France keeps a merge — daily FR chart is tab-thin / mixed, and
  // guitar AI pads (`editorial-top-france-guitar`) must not wipe each other.
  // Editorial shelves (hassidic/ribo/FR artists): merge to avoid wiping seed lists.
  const isChartShelf =
    (source.targetSlug.startsWith('spotify-') || source.key.startsWith('top-')) &&
    source.targetSlug !== 'spotify-top-france'
  const song_ids = isChartShelf
    ? songIds
    : Array.from(new Set([...(existing?.song_ids ?? []), ...songIds]))

  if (existing?.id) {
    const { error } = await (client.from('playlists') as any)
      .update({ ...row, song_ids })
      .eq('id', existing.id)
    if (error) throw error
    return 'updated'
  }

  const { error } = await (client.from('playlists') as any).insert([
    { ...row, song_ids, created_at: now },
  ])
  if (error) throw error
  return 'created'
}

async function seedOneTrack(
  client: SupabaseClient<Database>,
  title: string,
  artist: string,
  source: SpotifyPopularSource,
  dryRun: boolean
): Promise<PopularSeedTrackResult> {
  try {
    const hit = await searchTabsByLocale(title, artist, {
      marketHint: source.marketHint,
    })

    if (hit.results.length === 0) {
      return {
        status: 'skipped',
        title,
        artist,
        reason: `no ${hit.source} results (${hit.locale})`,
      }
    }

    const best = hit.results[0]

    if (dryRun) {
      return {
        status: 'added',
        title,
        artist,
        songId: 'dry-run',
        source: hit.source,
        locale: hit.locale,
      }
    }

    let upserted: { songId: string; action: 'added' | 'updated' }
    if (hit.source === 'tab4u') {
      upserted = await upsertCatalogSongFromTab4u(client, best, source.catalogGenre)
    } else if (hit.source === 'negina') {
      upserted = await upsertCatalogSongFromNegina(client, best, source.catalogGenre)
    } else {
      upserted = await upsertCatalogSongFromUg(client, best, source.catalogGenre)
    }

    return {
      status: upserted.action,
      title,
      artist,
      songId: upserted.songId,
      source: hit.source,
      locale: hit.locale,
    }
  } catch (error) {
    return {
      status: 'error',
      title,
      artist,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

export const popularCatalogSeedService = (client: SupabaseClient<Database>) => ({
  async seedFromSpotifyPopular(
    options: PopularCatalogSeedOptions = {}
  ): Promise<PopularSeedSourceSummary[]> {
    const dryRun = options.dryRun ?? false
    const delayMs = options.delayMs ?? REQUEST_DELAY_MS

    let sources: SpotifyPopularSource[]
    if (options.sourceKey) {
      const one = getSpotifyPopularSource(options.sourceKey)
      if (!one) {
        throw new Error(
          `Unknown source key "${options.sourceKey}". Available: ${SPOTIFY_POPULAR_SOURCES.map((s) => s.key).join(', ')}`
        )
      }
      sources = [one]
    } else {
      sources = listConfiguredSpotifyPopularSources()
    }

    if (sources.length === 0) {
      throw new Error('No popular sources configured')
    }

    const summaries: PopularSeedSourceSummary[] = []

    for (const source of sources) {
      const { tracks, method } = await researchPopularTracksForSource(
        source,
        options.limit ?? 50
      )
      const limited =
        options.limit != null ? tracks.slice(0, options.limit) : tracks

      console.log(
        `  researched ${limited.length} tracks for ${source.key} via ${method}`
      )

      const results: PopularSeedTrackResult[] = []
      const songIds: string[] = []

      for (const track of limited) {
        if (
          !researchedTrackAllowedForSource(
            source.targetSlug,
            track.title,
            track.artist
          )
        ) {
          const skipped: PopularSeedTrackResult = {
            status: 'skipped',
            title: track.title,
            artist: track.artist,
            reason: `membership rule rejected for ${source.targetSlug}`,
          }
          results.push(skipped)
          options.onTrack?.(skipped)
          continue
        }

        const result = await seedOneTrack(
          client,
          track.title,
          track.artist,
          source,
          dryRun
        )
        results.push(result)
        options.onTrack?.(result)

        if (
          (result.status === 'added' || result.status === 'updated') &&
          result.songId !== 'dry-run'
        ) {
          if (!songIds.includes(result.songId)) songIds.push(result.songId)
        }

        await sleep(delayMs)
      }

      const playlistAction = await upsertPlaylistSongIds(
        client,
        source,
        songIds,
        dryRun
      )

      summaries.push({
        key: source.key,
        targetSlug: source.targetSlug,
        researchMethod: method,
        playlistAction,
        songCount: songIds.length,
        added: results.filter((r) => r.status === 'added').length,
        updated: results.filter((r) => r.status === 'updated').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        errors: results.filter((r) => r.status === 'error').length,
        results,
      })
    }

    return summaries
  },
})
