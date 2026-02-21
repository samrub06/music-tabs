import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from '../library/FeaturedSongSection'
import RecentSongsSection from '../library/RecentSongsSection'
import PopularSongsSection from '../library/PopularSongsSection'

interface LibrarySectionsProps {
  userId?: string
}

export default async function LibrarySections({ userId }: LibrarySectionsProps) {
  const supabase = await createSafeServerClient()
  const songRepoInstance = songRepo(supabase)
  const playlistRepoInstance = playlistRepo(supabase)

  const [trendingSongs, recentSongs, popularSongs, publicPlaylists] = await Promise.all([
    songRepoInstance.getTrendingSongsLightweight(),
    songRepoInstance.getRecentSongsLightweight(15),
    songRepoInstance.getPopularSongsLightweight(15),
    playlistRepoInstance.getPublicPlaylistsLightweight(),
  ])

  return (
    <>
      <LibraryGridSection
        publicPlaylists={publicPlaylists}
        showLikedCard={!!userId}
      />
      <FeaturedSongSection 
        featuredSong={trendingSongs.length > 0 ? trendingSongs[0] : null} 
        userId={userId} 
      />
      <RecentSongsSection 
        songs={recentSongs} 
        userId={userId} 
      />
      <PopularSongsSection 
        songs={popularSongs} 
        userId={userId} 
      />
    </>
  )
}
