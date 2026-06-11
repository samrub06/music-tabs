import HorizontalSliderSkeleton from '@/app/(protected)/library/HorizontalSliderSkeleton'

export default function ExploreLoading() {
  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted sm:h-10 sm:w-56" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-[200px] animate-pulse rounded-md bg-muted sm:w-[280px]" />
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="mb-6 space-y-4">
        {[1, 2, 3].map((section) => (
          <div key={section}>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((chip) => (
                <div key={chip} className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <HorizontalSliderSkeleton />
    </div>
  )
}
