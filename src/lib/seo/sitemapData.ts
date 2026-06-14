import { createPublicCatalogClient } from '@/lib/supabase/server'
import { absoluteUrl } from './site'

const PAGE_SIZE = 1000

type SitemapRow = { id: string; updated_at: string | null }

async function fetchPaginatedRows(
  table: 'songs' | 'playlists',
  buildQuery: (client: ReturnType<typeof createPublicCatalogClient>) => {
    range: (from: number, to: number) => PromiseLike<{ data: SitemapRow[] | null; error: unknown }>
  }
): Promise<SitemapRow[]> {
  const rows: SitemapRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery(createPublicCatalogClient()).range(
      from,
      from + PAGE_SIZE - 1
    )

    if (error) {
      console.error(`[sitemap] failed to fetch ${table}:`, error)
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
  const rows = await fetchPaginatedRows('songs', (client) =>
    (client.from('songs') as any)
      .select('id, updated_at')
      .is('user_id', null)
      .or('is_trending.eq.true,is_public.eq.true')
      .order('updated_at', { ascending: false })
  )

  return rows.map((row) => ({
    url: absoluteUrl(`/song/${row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
  }))
}

export async function getPublicPlaylistSitemapEntries(): Promise<
  Array<{ url: string; lastModified?: Date }>
> {
  const rows = await fetchPaginatedRows('playlists', (client) =>
    (client.from('playlists') as any)
      .select('id, updated_at')
      .eq('is_public', true)
      .not('curated_slug', 'is', null)
      .order('updated_at', { ascending: false })
  )

  return rows.map((row) => ({
    url: absoluteUrl(`/library/${row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
  }))
}
