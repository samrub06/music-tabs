export default function SongsLoading() {
  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto p-3 sm:p-6">
      <div className="mb-4 flex w-full items-stretch gap-2">
        <div className="h-12 min-w-0 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="mb-4 flex w-full items-center gap-2 lg:hidden">
        <div className="h-11 min-w-0 flex-1 animate-pulse rounded-full bg-muted/80" />
        <div className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-muted/80" />
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="aspect-square w-full animate-pulse bg-muted" />
            <div className="space-y-2 p-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:block">
        <div className="border-b border-border bg-muted/50 px-6 py-3">
          <div className="flex gap-4">
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
              </div>
              <div className="hidden w-1/4 sm:block">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
