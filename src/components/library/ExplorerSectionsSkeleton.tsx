import FeaturedSongSkeleton from '@/app/(protected)/library/FeaturedSongSkeleton'
import HorizontalSliderSkeleton from '@/app/(protected)/library/HorizontalSliderSkeleton'

function LibraryGridSkeleton() {
  return (
    <div className="mb-6 w-full">
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide sm:hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 w-36 flex-shrink-0 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 sm:h-28 w-full rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

export default function ExplorerSectionsSkeleton() {
  return (
    <div className="w-full">
      <LibraryGridSkeleton />
      <FeaturedSongSkeleton />
      <HorizontalSliderSkeleton />
      <HorizontalSliderSkeleton />
    </div>
  )
}
