function FolderSongsSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
      <div className="mb-4 h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mb-4 h-12 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default FolderSongsSkeleton
