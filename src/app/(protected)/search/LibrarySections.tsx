import { createSafeServerClient } from '@/lib/supabase/server'
import { personalizedForYouService } from '@/lib/services/personalizedForYouService'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import ForYouArtistSection from '@/components/library/ForYouArtistSection'
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

  const forYouService = personalizedForYouService(supabase)

  const [trendingSongs, recentSongs, popularSongs, publicPlaylists, forYouData] =
    await Promise.all([
      songRepoInstance.getTrendingSongsLightweight(),
      songRepoInstance.getRecentSongsLightweight(15),
      songRepoInstance.getPopularSongsLightweight(15),
      playlistRepoInstance.getPublicPlaylistsLightweight(),
      userId ? forYouService.getForYouData(userId) : Promise.resolve(null),
    ])

  const featuredSong =
    forYouData?.featuredSong ?? (trendingSongs.length > 0 ? trendingSongs[0] : null)

  return (
    <>
      <LibraryGridSection
        publicPlaylists={publicPlaylists}
        showLikedCard={!!userId}
      />
      <FeaturedSongSection featuredSong={featuredSong} userId={userId} />
      <RecentSongsSection songs={recentSongs} userId={userId} />
      {userId && forYouData?.topArtist && forYouData.artistSongs.length > 0 && (
        <ForYouArtistSection
          artistName={forYouData.topArtist}
          songs={forYouData.artistSongs}
          userId={userId}
        />
      )}
      <PopularSongsSection songs={popularSongs} userId={userId} />
    </>
  )
}
