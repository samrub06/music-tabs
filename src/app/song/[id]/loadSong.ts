import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicCatalogClient, createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'

function getCachedPublicCatalogSong(id: string): Promise<Song | null> {
  return unstable_cache(
    async () => {
      const supabase = createPublicCatalogClient()
      return songRepo(supabase).getSong(id)
    },
    [`public-song-${id}`],
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
