import HorizontalSliderSkeleton from '@/app/(protected)/library/HorizontalSliderSkeleton'

export default function ExploreLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden p-3 sm:p-6">
      <div className="shrink-0 space-y-4 pb-4">
        <div className="h-12 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((section) => (
            <div key={section}>
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4, 5].map((chip) => (
                  <div key={chip} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <HorizontalSliderSkeleton />
    </div>
  )
}
