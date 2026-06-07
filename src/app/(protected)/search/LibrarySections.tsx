import { createSafeServerClient } from '@/lib/supabase/server'
import { personalizedForYouService } from '@/lib/services/personalizedForYouService'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import ForYouArtistSection from '@/components/library/ForYouArtistSection'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from '../library/FeaturedSongSection'
import RecentSongsSection from '../library/RecentSongsSection'
import PopularSongsSection from '../library/PopularSongsSection'
import type { ForYouArtistSong } from '@/types/forYou'

interface LibrarySectionsProps {
  userId?: string
}

export default async function LibrarySections({ userId }: LibrarySectionsProps) {
  const supabase = await createSafeServerClient()
  const songRepoInstance = songRepo(supabase)
  const playlistRepoInstance = playlistRepo(supabase)

  const forYouService = personalizedForYouService(supabase)

  const [trendingSongs, recentSongs, popularSongs, publicPlaylists, forYouResult, userSongs] =
    await Promise.all([
      songRepoInstance.getTrendingSongsLightweight(),
      songRepoInstance.getRecentSongsLightweight(15),
      songRepoInstance.getPopularSongsLightweight(15),
      playlistRepoInstance.getPublicPlaylistsLightweight(),
      userId
        ? forYouService.getForYouData(userId).catch((err) => {
            console.error('LibrarySections forYou fetch failed:', err)
            return { featuredSong: null, topArtist: null, artistSongs: [] }
          })
        : Promise.resolve(null),
      userId ? songRepoInstance.getAllSongsLightweight() : Promise.resolve([]),
    ])

  const forYouData = forYouResult

  const featuredSong =
    forYouData?.featuredSong ?? (trendingSongs.length > 0 ? trendingSongs[0] : null)

  const recentSongsWithLibraryStatus: ForYouArtistSong[] = recentSongs.map((song) => {
    const match = userId ? findUserSongMatch(song, userSongs) : undefined
    return {
      ...song,
      inUserLibrary: !!match,
      userSongId: match?.id,
    }
  })

  return (
    <>
      <LibraryGridSection
        publicPlaylists={publicPlaylists}
        showLikedCard={!!userId}
      />
      <RecentSongsSection songs={recentSongsWithLibraryStatus} userId={userId} />
      <FeaturedSongSection featuredSong={featuredSong} userId={userId} />
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
