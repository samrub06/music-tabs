import ExplorerSectionsSkeleton from '@/components/library/ExplorerSectionsSkeleton'

export default function SearchLoading() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-background p-4 pt-4 sm:p-6 sm:pt-6">
      <div className="mx-auto w-full max-w-7xl lg:max-w-none">
        <div className="mb-6 h-14 w-full animate-pulse rounded-xl bg-muted" />
        <ExplorerSectionsSkeleton />
      </div>
    </div>
  )
}
