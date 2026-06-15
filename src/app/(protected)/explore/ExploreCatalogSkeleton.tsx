interface ExploreCatalogSkeletonProps {
  view?: 'gallery' | 'table'
}

export default function ExploreCatalogSkeleton({ view = 'gallery' }: ExploreCatalogSkeletonProps) {
  if (view === 'table') {
    return (
      <div className="space-y-2 pb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
        <div className="mt-4 h-12 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-12 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
