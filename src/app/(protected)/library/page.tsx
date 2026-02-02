import { createSafeServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from './FeaturedSongSection'
import RecentSongsSection from './RecentSongsSection'
import PopularSongsSection from './PopularSongsSection'
import FeaturedSongSkeleton from './FeaturedSongSkeleton'
import HorizontalSliderSkeleton from './HorizontalSliderSkeleton'

export default async function LibraryPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-4 sm:p-6 lg:px-0 lg:py-8 overflow-y-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto lg:max-w-none lg:mx-0">
        {/* Section 1: Grille de 8 cards */}
        <LibraryGridSection />

        {/* Section 2: Featured Song */}
        <Suspense fallback={<FeaturedSongSkeleton />}>
          <FeaturedSongSection userId={user?.id} />
        </Suspense>

        {/* Section 3: Dernières chansons ajoutées */}
        <Suspense fallback={<HorizontalSliderSkeleton />}>
          <RecentSongsSection userId={user?.id} />
        </Suspense>

        {/* Section 4: Chansons les plus écoutées */}
        <Suspense fallback={<HorizontalSliderSkeleton />}>
          <PopularSongsSection userId={user?.id} />
        </Suspense>
      </div>
    </div>
  )
}
