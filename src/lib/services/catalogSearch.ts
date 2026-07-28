import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { SearchResult } from '@/lib/services/scraperService'
import {
  normalizeCatalogSourceUrl,
  normalizeTabId,
} from '@/lib/utils/catalogSourceIdentity'

export type CatalogSearchResult = SearchResult & {
  catalogSongId: string
  fromCatalog: true
  tabId?: string
}

export type MergeableSearchResult = SearchResult & {
  catalogSongId?: string
  fromCatalog?: boolean
  tabId?: string | number
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

function mapSourceSite(sourceSite: string | null | undefined): string {
  if (!sourceSite) return 'Catalog'
  if (/negina/i.test(sourceSite)) return 'Negina'
  if (/tab4u/i.test(sourceSite)) return 'Tab4U'
  if (/ultimate|guitar/i.test(sourceSite)) return 'Ultimate Guitar'
  return sourceSite
}

/**
 * Search public catalog songs by title/author (ilike).
 * Only returns rows with a source_url (needed for Add/View resolve path).
 */
export async function searchCatalogSongs(
  client: SupabaseClient<Database>,
  query: string,
  options: { limit?: number } = {}
): Promise<CatalogSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const limit = options.limit ?? 10
  const pattern = `%${escapeIlike(q)}%`

  const { data, error } = await (client.from('songs') as any)
    .select(
      'id, title, author, source_url, tab_id, source_site, rating, reviews, difficulty, version, version_description, artist_url, artist_image_url, song_image_url'
    )
    .is('user_id', null)
    .not('source_url', 'is', null)
    .or(`title.ilike."${pattern}",author.ilike."${pattern}"`)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) throw error

  return ((data || []) as Array<Record<string, unknown>>)
    .filter((row) => typeof row.source_url === 'string' && row.source_url)
    .map((row) => {
      const sourceUrl = String(row.source_url)
      let url = sourceUrl
      try {
        url = normalizeCatalogSourceUrl(sourceUrl)
      } catch {
        /* keep raw */
      }
      return {
        title: String(row.title || 'Sans titre'),
        author: String(row.author || 'Inconnu'),
        url,
        source: mapSourceSite(row.source_site as string | null),
        sourceSite: row.source_site as string | undefined,
        tabId: normalizeTabId(row.tab_id as string | null),
        rating: (row.rating as number | undefined) ?? undefined,
        reviews: (row.reviews as number | undefined) ?? undefined,
        difficulty: (row.difficulty as string | undefined) ?? undefined,
        version: (row.version as number | undefined) ?? undefined,
        versionDescription:
          (row.version_description as string | undefined) ?? undefined,
        artistUrl: (row.artist_url as string | undefined) ?? undefined,
        artistImageUrl: (row.artist_image_url as string | undefined) ?? undefined,
        songImageUrl: (row.song_image_url as string | undefined) ?? undefined,
        catalogSongId: String(row.id),
        fromCatalog: true as const,
      }
    })
}

function identityKeys(result: MergeableSearchResult): string[] {
  const keys: string[] = []
  const tabId = normalizeTabId(result.tabId)
  if (tabId) {
    keys.push(`tab:${tabId}`)
    if (/^\d{5,}$/.test(tabId)) keys.push(`tab:ug:${tabId}`)
    if (tabId.startsWith('ug:')) keys.push(`tab:${tabId.slice(3)}`)
  }
  if (result.url) {
    try {
      keys.push(`url:${normalizeCatalogSourceUrl(result.url)}`)
    } catch {
      keys.push(`url:${result.url.trim().toLowerCase()}`)
    }
  }
  return keys
}

/**
 * Catalog results first, then external — drop external rows that share
 * source_url / tab_id with a catalog hit. Different sources (UG vs Negina)
 * keep both when urls/tabIds differ.
 */
export function mergeCatalogAndExternalResults(
  catalog: MergeableSearchResult[],
  external: MergeableSearchResult[]
): MergeableSearchResult[] {
  const seen = new Set<string>()
  const out: MergeableSearchResult[] = []

  const add = (result: MergeableSearchResult) => {
    const keys = identityKeys(result)
    if (keys.some((k) => seen.has(k))) return
    for (const k of keys) seen.add(k)
    out.push(result)
  }

  for (const row of catalog) add({ ...row, fromCatalog: true })
  for (const row of external) add(row)
  return out
}
