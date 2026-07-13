export default function ChordsLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="mb-6 space-y-3">
          <div className="h-11 animate-pulse rounded-xl bg-muted" />
          <div className="flex gap-2 sm:gap-3">
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 h-20 animate-pulse rounded bg-muted" />
              <div className="mx-auto h-5 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
