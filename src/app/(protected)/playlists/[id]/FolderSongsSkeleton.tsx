function FolderSongsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6">
      <div className="mb-3 flex gap-2.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-20 shrink-0 space-y-1">
            <div className="aspect-square animate-pulse rounded-lg bg-muted" />
            <div className="mx-auto h-2 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="mb-3 h-11 w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FolderSongsSkeleton
