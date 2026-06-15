import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

function SongsToolbarSkeleton() {
  return (
    <div className="shrink-0 space-y-4 pb-4">
      <div className="flex items-stretch gap-2">
        <Bone className="h-[3.25rem] min-h-[52px] flex-1 rounded-lg sm:h-14" />
        <Bone className="h-11 w-11 shrink-0 rounded-xl" />
        <Bone className="h-11 w-11 shrink-0 rounded-xl" />
      </div>

      <div className="flex items-center gap-2">
        <Bone className="h-11 min-h-11 flex-1 rounded-full lg:hidden" />
        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted/80 p-0.5 lg:ml-auto">
          <Bone className="h-11 w-11 rounded-full sm:w-24" />
          <Bone className="h-11 w-11 rounded-full sm:w-24" />
        </div>
      </div>
    </div>
  )
}

function SongsTableRowsSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-2.5 px-4 py-2.5 sm:gap-3 sm:py-3">
          <Bone className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-[58%] max-w-[14rem]" />
            <Bone className="h-3 w-[42%] max-w-[10rem]" />
          </div>
          <Bone className="hidden h-4 w-16 shrink-0 sm:block" />
        </li>
      ))}
    </ul>
  )
}

function SongsGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bone className="aspect-square w-full rounded-xl" />
          <Bone className="h-4 w-[80%]" />
          <Bone className="h-3 w-[55%]" />
        </div>
      ))}
    </div>
  )
}

interface SongsPageSkeletonProps {
  view?: 'gallery' | 'table'
  className?: string
}

export default function SongsPageSkeleton({
  view = 'table',
  className,
}: SongsPageSkeletonProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-6',
        className
      )}
    >
      <SongsToolbarSkeleton />

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'gallery' ? <SongsGallerySkeleton /> : <SongsTableRowsSkeleton />}
        <Bone className="mt-4 h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}
