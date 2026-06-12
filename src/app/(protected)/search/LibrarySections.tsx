import { createSafeServerClient } from '@/lib/supabase/server'
import { getCachedLibraryCatalogSections } from '@/lib/services/libraryCatalogCache'
import { personalizedForYouService } from '@/lib/services/personalizedForYouService'
import { songRepo } from '@/lib/services/songRepo'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import ForYouArtistSection from '@/components/library/ForYouArtistSection'
import CuratedPlaylistRow from '@/components/library/CuratedPlaylistRow'
import FeaturedSongSection from '../library/FeaturedSongSection'
import RecentSongsSection from '../library/RecentSongsSection'
import PopularSongsSection from '../library/PopularSongsSection'
import SpotifyComingSoonSection from '@/components/library/SpotifyComingSoonSection'
import { profileRepo } from '@/lib/services/profileRepo'
import type { ForYouArtistSong } from '@/types/forYou'

interface LibrarySectionsProps {
  userId?: string
}

export default async function LibrarySections({ userId }: LibrarySectionsProps) {
  const supabase = await createSafeServerClient()
  const songRepoInstance = songRepo(supabase)
  const forYouService = personalizedForYouService(supabase)

  const profileRepoInstance = profileRepo(supabase)

  const [catalogSections, userSongs, spotifyId] = await Promise.all([
    getCachedLibraryCatalogSections(),
    userId ? songRepoInstance.getAllSongsLightweight() : Promise.resolve([]),
    userId ? profileRepoInstance.getSpotifyId(userId) : Promise.resolve(null),
  ])

  const forYouData = userId
    ? await forYouService.getForYouData(userId, userSongs).catch((err) => {
        console.error('LibrarySections forYou fetch failed:', err)
        return { featuredSong: null, topArtist: null, artistSongs: [] }
      })
    : null

  const { trendingSongs, recentSongs, popularSongs, publicPlaylists, featuredCatalogSong } =
    catalogSections

  const featuredSong =
    featuredCatalogSong ??
    forYouData?.featuredSong ??
    (trendingSongs.length > 0 ? trendingSongs[0] : null)

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
      <CuratedPlaylistRow
        section="genre"
        publicPlaylists={publicPlaylists}
        showUserShortcutCards={!!userId}
      />
      <CuratedPlaylistRow section="jewish" publicPlaylists={publicPlaylists} />
      <SpotifyComingSoonSection spotifyId={spotifyId} />
      <RecentSongsSection songs={recentSongsWithLibraryStatus} userId={userId} />
      <CuratedPlaylistRow section="decade" publicPlaylists={publicPlaylists} />
      <FeaturedSongSection featuredSong={featuredSong} userId={userId} />
      {userId && forYouData?.topArtist && forYouData.artistSongs.length > 0 && (
        <ForYouArtistSection
          artistName={forYouData.topArtist}
          songs={forYouData.artistSongs}
          userId={userId}
        />
      )}
      <CuratedPlaylistRow section="difficulty" publicPlaylists={publicPlaylists} />
      <PopularSongsSection songs={popularSongs} userId={userId} />
    </>
  )
}
