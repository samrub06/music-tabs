import { createSafeServerClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import { songRepo } from '@/lib/services/songRepo'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from './FeaturedSongSection'
import RecentSongsSection from './RecentSongsSection'
import PopularSongsSection from './PopularSongsSection'

export default async function LibraryPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const repo = songRepo(supabase)

  // Paralléliser les 3 requêtes
  const [trendingSongs, recentSongs, popularSongs] = await Promise.all([
    repo.getTrendingSongsLightweight(),
    repo.getRecentSongsLightweight(15),
    repo.getPopularSongsLightweight(15),
  ])

  return (
    <div className="p-4 sm:p-6 lg:px-6 lg:py-8 overflow-y-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto lg:max-w-none lg:mx-0">
        {/* Section 1: Grille de 8 cards */}
        <LibraryGridSection />

        {/* Section 2: Featured Song */}
        <FeaturedSongSection 
          featuredSong={trendingSongs.length > 0 ? trendingSongs[0] : null} 
          userId={user?.id} 
        />

        {/* Section 3: Dernières chansons ajoutées */}
        <RecentSongsSection 
          songs={recentSongs} 
          userId={user?.id} 
        />

        {/* Section 4: Chansons les plus écoutées */}
        <PopularSongsSection 
          songs={popularSongs} 
          userId={user?.id} 
        />
      </div>
    </div>
  )
}
