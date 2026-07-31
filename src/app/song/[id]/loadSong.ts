import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import {
  createPublicCatalogClient,
  createSafeServerClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { isUuid } from '@/utils/slugify'
import type { Song } from '@/types'

async function fetchPublicCatalogSong(param: string): Promise<Song | null> {
  const supabase = createPublicCatalogClient()
  return songRepo(supabase).getSongByIdOrSlug(param)
}

function getCachedPublicCatalogSong(param: string): Promise<Song | null> {
  if (process.env.NODE_ENV === 'development') {
    return fetchPublicCatalogSong(param)
  }

  return unstable_cache(
    async () => fetchPublicCatalogSong(param),
    [`public-song-v3-${param}`],
    { revalidate: 3600, tags: [`song-${param}`] }
  )()
}

/** Per-request dedupe: metadata + page share one DB round-trip. */
export const getCachedSong = cache(async (param: string): Promise<Song | null> => {
  const decoded = decodeURIComponent(param).trim()
  const publicSong = await getCachedPublicCatalogSong(decoded)
  if (publicSong && !publicSong.userId) {
    return publicSong
  }

  // Private / library songs are UUID-only
  if (!isUuid(decoded)) {
    return publicSong
  }

  const supabase = await createSafeServerClient()
  return songRepo(supabase).getSong(decoded)
})

/**
 * Song fields for Open Graph / social crawlers (no user session).
 * Falls back to service role so private/library song links still preview.
 */
export const getSongForOpenGraph = cache(async (param: string): Promise<Song | null> => {
  const sessionSong = await getCachedSong(param)
  if (sessionSong) return sessionSong

  const decoded = decodeURIComponent(param).trim()
  if (!isUuid(decoded)) return null

  try {
    const service = createServiceRoleClient()
    return songRepo(service).getSong(decoded)
  } catch (error) {
    console.error('Open Graph song fetch via service role failed:', error)
    return null
  }
})
