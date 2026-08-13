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
  score?: number
}

export type MergeableSearchResult = SearchResult & {
  catalogSongId?: string
  fromCatalog?: boolean
  tabId?: string | number
  score?: number
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

function normalizeTitleAuthorKey(title: string, author: string): string {
  return `${title}`.trim().toLowerCase().replace(/\s+/g, ' ') +
    '|' +
    `${author}`.trim().toLowerCase().replace(/\s+/g, ' ')
}

type CatalogRow = {
  id: string
  title: string | null
  author: string | null
  source_url: string | null
  tab_id: string | null
  source_site: string | null
  rating: number | null
  reviews: number | null
  difficulty: string | null
  version: number | null
  version_description: string | null
  artist_url: string | null
  artist_image_url: string | null
  song_image_url: string | null
  slug?: string | null
  score?: number | null
}

function mapCatalogRow(row: CatalogRow): CatalogSearchResult | null {
  const id = String(row.id)
  const sourceUrl = row.source_url
  let url = typeof sourceUrl === 'string' && sourceUrl.trim() ? sourceUrl : ''
  if (url) {
    try {
      url = normalizeCatalogSourceUrl(url)
    } catch {
      /* keep raw */
    }
  } else {
    // Catalog hit without source_url — open by id in the app
    url = `/song/${row.slug?.trim() || id}`
  }

  return {
    title: String(row.title || 'Sans titre'),
    author: String(row.author || 'Inconnu'),
    url,
    source: mapSourceSite(row.source_site),
    sourceSite: row.source_site ?? undefined,
    tabId: normalizeTabId(row.tab_id) ?? undefined,
    rating: row.rating ?? undefined,
    reviews: row.reviews ?? undefined,
    difficulty: row.difficulty ?? undefined,
    version: row.version ?? undefined,
    versionDescription: row.version_description ?? undefined,
    artistUrl: row.artist_url ?? undefined,
    artistImageUrl: row.artist_image_url ?? undefined,
    songImageUrl: row.song_image_url ?? undefined,
    catalogSongId: id,
    fromCatalog: true as const,
    score: typeof row.score === 'number' ? row.score : undefined,
  }
}

/**
 * Fallback when RPC is unavailable: tokenized ilike (each token must match
 * title or author) + full-query ilike, ordered by view_count.
 */
async function searchCatalogSongsIlikeFallback(
  client: SupabaseClient<Database>,
  query: string,
  limit: number
): Promise<CatalogSearchResult[]> {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6)

  const orParts = [`title.ilike."%${escapeIlike(query)}%"`, `author.ilike."%${escapeIlike(query)}%"`]
  for (const token of tokens) {
    const p = escapeIlike(token)
    orParts.push(`title.ilike."%${p}%"`)
    orParts.push(`author.ilike."%${p}%"`)
  }

  const { data, error } = await (client.from('songs') as any)
    .select(
      'id, title, author, source_url, tab_id, source_site, rating, reviews, difficulty, version, version_description, artist_url, artist_image_url, song_image_url, slug, view_count'
    )
    .is('user_id', null)
    .or(orParts.join(','))
    .order('view_count', { ascending: false })
    .limit(Math.max(limit * 3, 30))

  if (error) throw error

  const rows = (data || []) as CatalogRow[]
  const qLower = query.toLowerCase()

  const scored = rows
    .map((row) => {
      const title = (row.title || '').toLowerCase()
      const author = (row.author || '').toLowerCase()
      const hay = `${title} ${author}`
      let score = 0
      if (title === qLower) score += 3
      else if (title.startsWith(qLower)) score += 2
      else if (title.includes(qLower) || author.includes(qLower)) score += 1
      if (tokens.length > 0) {
        const hit = tokens.filter((t) => hay.includes(t)).length
        score += hit / tokens.length
        // Prefer rows that cover most tokens
        if (hit < Math.ceil(tokens.length * 0.5)) return null
      }
      return { row, score }
    })
    .filter((x): x is { row: CatalogRow; score: number } => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
    .map(({ row, score }) => {
      const mapped = mapCatalogRow({ ...row, score })
      return mapped
    })
    .filter((r): r is CatalogSearchResult => r != null)
}

/**
 * Search public catalog songs with typo tolerance (pg_trgm RPC),
 * falling back to tokenized ilike. Catalog hits are preferred over scrapers.
 */
export async function searchCatalogSongs(
  client: SupabaseClient<Database>,
  query: string,
  options: { limit?: number } = {}
): Promise<CatalogSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const limit = options.limit ?? 20

  try {
    const { data, error } = await (client as any).rpc('search_public_catalog_songs', {
      search_query: q,
      result_limit: limit,
    })
    if (error) throw error
    return ((data || []) as CatalogRow[])
      .map(mapCatalogRow)
      .filter((r): r is CatalogSearchResult => r != null)
  } catch (rpcError) {
    console.warn('search_public_catalog_songs RPC unavailable, using ilike fallback:', rpcError)
    return searchCatalogSongsIlikeFallback(client, q, limit)
  }
}

function identityKeys(result: MergeableSearchResult): string[] {
  const keys: string[] = []
  const tabId = normalizeTabId(result.tabId)
  if (tabId) {
    keys.push(`tab:${tabId}`)
    if (/^\d{5,}$/.test(tabId)) keys.push(`tab:ug:${tabId}`)
    if (tabId.startsWith('ug:')) keys.push(`tab:${tabId.slice(3)}`)
  }
  if (result.url && !result.url.startsWith('/song/')) {
    try {
      keys.push(`url:${normalizeCatalogSourceUrl(result.url)}`)
    } catch {
      keys.push(`url:${result.url.trim().toLowerCase()}`)
    }
  }
  // Prefer catalog over scraper for the same title+artist
  keys.push(`ta:${normalizeTitleAuthorKey(result.title, result.author)}`)
  return keys
}

/**
 * Catalog results first, then external — drop external rows that share
 * source_url / tab_id / title+author with a catalog hit.
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
