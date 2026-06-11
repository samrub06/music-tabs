export default function SongLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-6 w-2/3 max-w-sm animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 max-w-xs animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="min-h-[50vh] flex-1 animate-pulse rounded-2xl bg-muted/60" />
      <div className="mt-4 h-14 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}
