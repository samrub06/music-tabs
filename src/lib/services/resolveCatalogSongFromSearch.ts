import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { NewSongData, Song } from '@/types'
import {
  scrapeSongFromUrl,
  type ScrapedSong,
  type SearchResult,
} from '@/lib/services/scraperService'
import { songRepo } from '@/lib/services/songRepo'
import {
  buildCatalogSourceIdentity,
  catalogTabIdLookupCandidates,
  deriveTabIdFromSourceUrl,
  normalizeTabId,
  type CatalogSourceIdentity,
} from '@/lib/utils/catalogSourceIdentity'

export type ResolveCatalogFromSearchInput = {
  url: string
  title?: string
  author?: string
  source?: string
  tabId?: string | number | null
  reviews?: number
  version?: number
  rating?: number
  difficulty?: string
  versionDescription?: string
  artistUrl?: string
  artistImageUrl?: string
  songImageUrl?: string
}

export type ResolveCatalogFromSearchResult = {
  catalogSongId: string
  catalogSong: Song
  scraped: boolean
  identity: CatalogSourceIdentity
}

export type CatalogSongLookup = {
  findCatalogSongBySourceIdentity: (match: {
    tabId?: string | number | null
    tabIdCandidates?: string[]
    sourceUrl?: string | null
  }) => Promise<{ id: string } | null>
  getSong: (id: string) => Promise<Song | null>
  createSystemSong: (
    songData: NewSongData,
    options?: { isTrending?: boolean; isPublic?: boolean; genre?: string; decade?: number }
  ) => Promise<Song>
}

export type ResolveCatalogDeps = {
  catalog: CatalogSongLookup
  scrape: (
    url: string,
    searchResult?: SearchResult
  ) => Promise<ScrapedSong | null>
}

function toSearchResult(input: ResolveCatalogFromSearchInput): SearchResult {
  return {
    title: input.title || 'Sans titre',
    author: input.author || 'Inconnu',
    url: input.url,
    source: input.source || 'Unknown',
    reviews: input.reviews,
    version: input.version,
    rating: input.rating,
    difficulty: input.difficulty,
    versionDescription: input.versionDescription,
    artistUrl: input.artistUrl,
    artistImageUrl: input.artistImageUrl,
    songImageUrl: input.songImageUrl,
  }
}

function resolveTabIdForCatalog(
  identity: CatalogSourceIdentity,
  scraped: ScrapedSong
): string | undefined {
  return (
    normalizeTabId(scraped.tabId) ??
    identity.tabId ??
    deriveTabIdFromSourceUrl(identity.sourceUrl)
  )
}

function mapSourceSite(
  scraped: ScrapedSong,
  input: ResolveCatalogFromSearchInput
): string {
  if (scraped.source) return scraped.source
  if (input.source) return input.source
  try {
    const host = new URL(input.url).hostname.toLowerCase()
    if (host.includes('negina')) return 'Negina'
    if (host.includes('tab4u')) return 'Tab4U'
    if (host.includes('ultimate-guitar')) return 'Ultimate Guitar'
  } catch {
    /* ignore */
  }
  return 'Unknown'
}

function catalogLookupFromClient(
  catalogClient: SupabaseClient<Database>
): CatalogSongLookup {
  const repo = songRepo(catalogClient)
  return {
    findCatalogSongBySourceIdentity: (match) =>
      repo.findCatalogSongBySourceIdentity(match),
    getSong: (id) => repo.getSong(id),
    createSystemSong: (data, options) => repo.createSystemSong(data, options),
  }
}

/**
 * Find catalog song by source identity, or scrape once and create a public catalog row.
 */
export async function resolveCatalogSongFromSearch(
  input: ResolveCatalogFromSearchInput,
  deps: ResolveCatalogDeps
): Promise<ResolveCatalogFromSearchResult> {
  const identity = buildCatalogSourceIdentity({
    url: input.url,
    tabId: input.tabId,
  })
  const tabIdCandidates = catalogTabIdLookupCandidates(identity)

  const existing = await deps.catalog.findCatalogSongBySourceIdentity({
    tabIdCandidates,
    sourceUrl: identity.sourceUrl,
  })

  if (existing) {
    const catalogSong = await deps.catalog.getSong(existing.id)
    if (!catalogSong) {
      throw new Error('Catalog song not found after identity match')
    }
    return {
      catalogSongId: existing.id,
      catalogSong,
      scraped: false,
      identity,
    }
  }

  const searchResult = toSearchResult({ ...input, url: identity.sourceUrl })
  const scraped = await deps.scrape(identity.sourceUrl, searchResult)
  if (!scraped?.content?.trim()) {
    throw new Error('Unable to scrape song content from source URL')
  }

  const scrapedTabId = normalizeTabId(scraped.tabId)
  const raced = await deps.catalog.findCatalogSongBySourceIdentity({
    tabIdCandidates: [
      ...tabIdCandidates,
      ...(scrapedTabId ? [scrapedTabId] : []),
    ],
    sourceUrl: identity.sourceUrl,
  })
  if (raced) {
    const catalogSong = await deps.catalog.getSong(raced.id)
    if (!catalogSong) {
      throw new Error('Catalog song not found after race re-check')
    }
    return {
      catalogSongId: raced.id,
      catalogSong,
      scraped: false,
      identity,
    }
  }

  const tabId = resolveTabIdForCatalog(identity, scraped)
  try {
    const created = await deps.catalog.createSystemSong(
      {
        title: (scraped.title || input.title || 'Sans titre').trim(),
        author: (scraped.author || input.author || 'Inconnu').trim(),
        content: scraped.content.trim(),
        reviews: input.reviews ?? scraped.reviews ?? 0,
        capo: scraped.capo,
        key: scraped.key,
        version: scraped.version ?? input.version,
        versionDescription:
          scraped.versionDescription ?? input.versionDescription,
        rating: scraped.rating ?? input.rating,
        difficulty: scraped.difficulty ?? input.difficulty,
        artistUrl: scraped.artistUrl ?? input.artistUrl,
        artistImageUrl: scraped.artistImageUrl ?? input.artistImageUrl,
        songImageUrl: scraped.songImageUrl ?? input.songImageUrl,
        sourceUrl: identity.sourceUrl,
        sourceSite: mapSourceSite(scraped, input),
        tabId,
        bpm: scraped.bpm,
      },
      { isPublic: true, isTrending: false }
    )

    return {
      catalogSongId: created.id,
      catalogSong: created,
      scraped: true,
      identity,
    }
  } catch (error) {
    const again = await deps.catalog.findCatalogSongBySourceIdentity({
      tabIdCandidates: tabId ? [tabId, ...tabIdCandidates] : tabIdCandidates,
      sourceUrl: identity.sourceUrl,
    })
    if (again) {
      const catalogSong = await deps.catalog.getSong(again.id)
      if (catalogSong) {
        return {
          catalogSongId: again.id,
          catalogSong,
          scraped: false,
          identity,
        }
      }
    }
    throw error
  }
}

export function createDefaultResolveCatalogDeps(
  catalogClient: SupabaseClient<Database>
): ResolveCatalogDeps {
  return {
    catalog: catalogLookupFromClient(catalogClient),
    scrape: scrapeSongFromUrl,
  }
}
