export default function HorizontalSliderSkeleton() {
  return (
    <div className="mb-8 w-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="h-7 w-48 max-w-[70%] animate-pulse rounded bg-muted" />
        <div className="flex shrink-0 gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div
        className="flex w-full gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-40 flex-shrink-0 sm:w-48">
            <div className="mb-2 aspect-square w-full animate-pulse rounded-lg bg-muted" />
            <div className="px-1">
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-8 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
