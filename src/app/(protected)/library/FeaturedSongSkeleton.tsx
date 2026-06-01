export default function FeaturedSongSkeleton() {
  return (
    <div className="mb-8 w-full">
      <div className="mb-5 h-8 w-48 max-w-full animate-pulse rounded bg-muted" />
      <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-muted animate-pulse sm:h-64">
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-muted-foreground/20" />
              <div className="h-14 w-14 rounded-full bg-muted-foreground/20" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1 pr-4">
              <div className="mb-2 h-4 w-24 rounded bg-muted-foreground/20" />
              <div className="h-8 w-3/4 rounded bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 rounded-full bg-muted-foreground/20" />
              <div className="h-8 w-16 rounded-full bg-muted-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
