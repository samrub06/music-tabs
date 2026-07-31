import { createPublicCatalogClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { absoluteUrl, absoluteArtistUrl } from './songPath'
import { artistSlugFromAuthor } from '@/utils/slugify'

const PAGE_SIZE = 1000

type SitemapSongRow = {
  id: string
  slug: string | null
  updated_at: string | null
}

type SitemapPlaylistRow = { id: string; updated_at: string | null }

async function fetchPaginatedSongs(): Promise<SitemapSongRow[]> {
  const rows: SitemapSongRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await (createPublicCatalogClient().from('songs') as any)
      .select('id, slug, updated_at')
      .is('user_id', null)
      .or('is_trending.eq.true,is_public.eq.true')
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('[sitemap] failed to fetch songs:', error)
      break
    }
    if (!data?.length) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

async function fetchPaginatedPlaylists(): Promise<SitemapPlaylistRow[]> {
  const rows: SitemapPlaylistRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await (createPublicCatalogClient().from('playlists') as any)
      .select('id, updated_at')
      .eq('is_public', true)
      .not('curated_slug', 'is', null)
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('[sitemap] failed to fetch playlists:', error)
      break
    }
    if (!data?.length) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

export async function getPublicSongSitemapEntries(): Promise<
  Array<{ url: string; lastModified?: Date }>
> {
  const rows = await fetchPaginatedSongs()

  return rows.map((row) => ({
    url: absoluteUrl(`/song/${row.slug?.trim() || row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
  }))
}

export async function getPublicPlaylistSitemapEntries(): Promise<
  Array<{ url: string; lastModified?: Date }>
> {
  const rows = await fetchPaginatedPlaylists()

  return rows.map((row) => ({
    url: absoluteUrl(`/library/${row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
  }))
}

export async function getPublicArtistSitemapEntries(): Promise<
  Array<{ url: string; lastModified?: Date }>
> {
  const supabase = createPublicCatalogClient()
  const authors = await songRepo(supabase).getPublicCatalogAuthors()
  const seen = new Set<string>()
  const entries: Array<{ url: string; lastModified?: Date }> = []

  for (const author of authors) {
    const slug = artistSlugFromAuthor(author)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    entries.push({ url: absoluteArtistUrl(slug) })
  }

  return entries
}
