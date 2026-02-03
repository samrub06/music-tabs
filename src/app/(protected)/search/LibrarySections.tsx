import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from '../library/FeaturedSongSection'
import RecentSongsSection from '../library/RecentSongsSection'
import PopularSongsSection from '../library/PopularSongsSection'

interface LibrarySectionsProps {
  userId?: string
}

export default async function LibrarySections({ userId }: LibrarySectionsProps) {
  const supabase = await createSafeServerClient()
  const repo = songRepo(supabase)

  // Paralléliser les 3 requêtes
  const [trendingSongs, recentSongs, popularSongs] = await Promise.all([
    repo.getTrendingSongsLightweight(),
    repo.getRecentSongsLightweight(15),
    repo.getPopularSongsLightweight(15),
  ])

  return (
    <>
      <LibraryGridSection />
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
