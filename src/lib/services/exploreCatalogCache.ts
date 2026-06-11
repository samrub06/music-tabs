import { unstable_cache } from 'next/cache'
import { createPublicCatalogClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'

export const EXPLORE_CATALOG_TAG = 'explore-catalog'

export type ExploreCatalogParams = {
  page: number
  limit: number
  q?: string
  genre?: string
  difficulty?: string
  decade?: number
}

function exploreCacheKey(params: ExploreCatalogParams): string {
  const { page, limit, q = '', genre = '', difficulty = '', decade = '' } = params
  return `explore:${page}:${limit}:${q}:${genre}:${difficulty}:${decade}`
}

export async function getCachedExploreCatalog(
  params: ExploreCatalogParams
): Promise<{ songs: Song[]; total: number }> {
  const hasSearch = Boolean(params.q?.trim())
  const revalidate = hasSearch ? 60 : 300

  return unstable_cache(
    async () => {
      const supabase = createPublicCatalogClient()
      return songRepo(supabase).getTrendingSongsPaged(
        params.page,
        params.limit,
        params.q,
        params.genre,
        params.difficulty,
        params.decade
      )
    },
    [exploreCacheKey(params)],
    { revalidate, tags: [EXPLORE_CATALOG_TAG] }
  )()
}
