import FeaturedSongSkeleton from '@/app/(protected)/library/FeaturedSongSkeleton'
import HorizontalSliderSkeleton from '@/app/(protected)/library/HorizontalSliderSkeleton'

function HubZoneMixedSkeleton() {
  return (
    <div className="mb-6 space-y-4">
      <div className="mb-2 h-6 w-36 animate-pulse rounded bg-muted" />
      {/* 2-row horizontal list strip — 2 columns visible */}
      <div
        className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 scrollbar-hide auto-cols-[calc((100%-0.5rem)/2)]"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex h-14 min-w-0 items-center gap-2.5 overflow-hidden rounded-lg bg-muted/80 sm:h-16"
          >
            <div className="h-full w-14 shrink-0 animate-pulse bg-muted sm:w-16" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Artist banners — 2-row horizontal scroll, 2 columns visible */}
      <div
        className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 scrollbar-hide auto-cols-[calc((100%-0.5rem)/2)]"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="min-h-[7.5rem] min-w-0 animate-pulse rounded-xl bg-muted sm:min-h-[8.25rem]"
          />
        ))}
      </div>
      {/* Square horizontal shelf */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-28 flex-shrink-0 space-y-1 sm:w-32">
            <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DecadeDifficultySkeleton() {
  return (
    <div className="mb-6 w-full">
      <div className="mb-3 h-6 w-32 animate-pulse rounded bg-muted" />
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 w-28 flex-shrink-0 animate-pulse rounded-lg bg-muted sm:h-32 sm:w-32"
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

/** Mirrors LibrarySections: hub mixed layouts → featured song → decade/difficulty → lists */
export default function ExplorerSectionsSkeleton() {
  return (
    <div className="w-full">
      <HubZoneMixedSkeleton />
      <HubZoneMixedSkeleton />
      <HubZoneMixedSkeleton />
      <FeaturedSongSkeleton />
      <DecadeDifficultySkeleton />
      <DecadeDifficultySkeleton />
      <VerticalListSkeleton />
      <HorizontalSliderSkeleton />
    </div>
  )
}
