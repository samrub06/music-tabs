function PlaylistSongsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-32 w-32 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlaylistSongsSkeleton
