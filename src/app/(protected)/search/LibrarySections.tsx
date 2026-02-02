import { Suspense } from 'react'
import LibraryGridSection from '@/components/library/LibraryGridSection'
import FeaturedSongSection from './FeaturedSongSection'
import RecentSongsSection from './RecentSongsSection'
import PopularSongsSection from './PopularSongsSection'
import FeaturedSongSkeleton from '../library/FeaturedSongSkeleton'
import HorizontalSliderSkeleton from '../library/HorizontalSliderSkeleton'

interface LibrarySectionsProps {
  userId?: string
}

export default function LibrarySections({ userId }: LibrarySectionsProps) {
  return (
    <>
      {/* Section 1: Grille de 8 cards */}
      <LibraryGridSection />

      {/* Section 2: Featured Song */}
      <Suspense fallback={<FeaturedSongSkeleton />}>
        <FeaturedSongSection userId={userId} />
      </Suspense>

      {/* Section 3: Dernières chansons ajoutées */}
      <Suspense fallback={<HorizontalSliderSkeleton />}>
        <RecentSongsSection userId={userId} />
      </Suspense>

      {/* Section 4: Chansons les plus écoutées */}
      <Suspense fallback={<HorizontalSliderSkeleton />}>
        <PopularSongsSection userId={userId} />
      </Suspense>
    </>
  )
}
