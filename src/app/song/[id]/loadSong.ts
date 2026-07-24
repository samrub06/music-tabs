import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import {
  createPublicCatalogClient,
  createSafeServerClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'

async function fetchPublicCatalogSong(id: string): Promise<Song | null> {
  const supabase = createPublicCatalogClient()
  return songRepo(supabase).getSong(id)
}

function getCachedPublicCatalogSong(id: string): Promise<Song | null> {
  if (process.env.NODE_ENV === 'development') {
    return fetchPublicCatalogSong(id)
  }

  return unstable_cache(
    async () => fetchPublicCatalogSong(id),
    [`public-song-v2-${id}`],
    { revalidate: 3600, tags: [`song-${id}`] }
  )()
}

/** Per-request dedupe: metadata + page share one DB round-trip. */
export const getCachedSong = cache(async (id: string): Promise<Song | null> => {
  const publicSong = await getCachedPublicCatalogSong(id)
  if (publicSong && !publicSong.userId) {
    return publicSong
  }

  const supabase = await createSafeServerClient()
  return songRepo(supabase).getSong(id)
})

/**
 * Song fields for Open Graph / social crawlers (no user session).
 * Falls back to service role so private/library song links still preview.
 */
export const getSongForOpenGraph = cache(async (id: string): Promise<Song | null> => {
  const sessionSong = await getCachedSong(id)
  if (sessionSong) return sessionSong

  try {
    const service = createServiceRoleClient()
    return songRepo(service).getSong(id)
  } catch (error) {
    console.error('Open Graph song fetch via service role failed:', error)
    return null
  }
})
