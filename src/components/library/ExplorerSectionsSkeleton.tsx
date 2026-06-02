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

function VerticalListSkeleton() {
  return (
    <div className="mb-6">
      <div className="mb-3 h-6 w-44 animate-pulse rounded bg-muted" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 border-b border-border/40 py-2 last:border-0"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ExplorerSectionsSkeleton() {
  return (
    <div className="w-full">
      <LibraryGridSkeleton />
      <VerticalListSkeleton />
      <FeaturedSongSkeleton />
      <VerticalListSkeleton />
      <HorizontalSliderSkeleton />
    </div>
  )
}
