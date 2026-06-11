import { unstable_cache } from 'next/cache'
import { createPublicCatalogClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'

export const LIBRARY_CATALOG_TAG = 'library-catalog'

type PublicPlaylistLightweight = Awaited<
  ReturnType<ReturnType<typeof playlistRepo>['getPublicPlaylistsLightweight']>
>

export type LibraryCatalogSections = {
  trendingSongs: Song[]
  recentSongs: Song[]
  popularSongs: Song[]
  publicPlaylists: PublicPlaylistLightweight
  featuredCatalogSong: Song | null
}

export async function getCachedLibraryCatalogSections(): Promise<LibraryCatalogSections> {
  return unstable_cache(
    async () => {
      const supabase = createPublicCatalogClient()
      const songRepoInstance = songRepo(supabase)
      const playlistRepoInstance = playlistRepo(supabase)

      const [trendingSongs, recentSongs, popularSongs, publicPlaylists, featuredCatalogSong] =
        await Promise.all([
          songRepoInstance.getTrendingSongsLightweight(),
          songRepoInstance.getRecentSongsLightweight(15),
          songRepoInstance.getPopularSongsLightweight(15),
          playlistRepoInstance.getPublicPlaylistsLightweight(),
          songRepoInstance.getFeaturedCatalogSongLightweight(),
        ])

      return { trendingSongs, recentSongs, popularSongs, publicPlaylists, featuredCatalogSong }
    },
    ['library-catalog-sections'],
    { revalidate: 300, tags: [LIBRARY_CATALOG_TAG] }
  )()
}
