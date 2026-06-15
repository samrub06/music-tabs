import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

function SongHeaderSkeleton() {
  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="flex min-h-[3.5rem] items-center justify-between gap-2 p-2 sm:min-h-[4rem] sm:p-3">
        <Bone className="h-10 w-10 shrink-0 rounded-lg" />
        <Bone className="h-10 min-w-0 flex-1 rounded-xl sm:max-w-[13rem]" />
        <div className="flex shrink-0 items-center gap-1">
          <Bone className="h-10 w-10 rounded-lg" />
          <Bone className="h-10 w-[5.25rem] rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function TitleCardSkeleton() {
  return (
    <div className="rounded-xl bg-card px-4 py-3 shadow-sm dark:bg-gray-900/60">
      <div className="flex h-14 min-h-14 items-stretch gap-3 sm:h-16 sm:min-h-16">
        <Bone className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <Bone className="h-5 w-[72%] max-w-xs" />
          <Bone className="h-4 w-[42%] max-w-[8rem]" />
        </div>
        <Bone className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16" />
      </div>
      <Bone className="mt-3 h-11 w-full rounded-xl" />
    </div>
  )
}

function ChordsSectionSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Bone className="h-12 min-h-[3rem] w-full rounded-md" />
      <div className="space-y-3 pt-1">
        <div className="flex gap-3 overflow-hidden pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone
              key={i}
              className="h-[8.5rem] w-[10.5rem] shrink-0 rounded-xl"
            />
          ))}
        </div>
        <div className="flex h-12 items-center gap-2">
          <Bone className="h-11 w-28 shrink-0 rounded-full" />
          <Bone className="h-11 w-24 shrink-0 rounded-full" />
          <Bone className="h-11 w-[4.5rem] shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function LyricsLineSkeleton({ width }: { width: string }) {
  return <Bone className={cn('h-7 w-full', width)} />
}

function LyricsSectionSkeleton({
  titleWidth,
  lineWidths,
}: {
  titleWidth: string
  lineWidths: string[]
}) {
  return (
    <div className="w-full space-y-2">
      <Bone className={cn('h-10 w-full rounded-md', titleWidth)} />
      <div className="space-y-2 pt-1">
        {lineWidths.map((width, i) => (
          <LyricsLineSkeleton key={i} width={width} />
        ))}
      </div>
    </div>
  )
}

const LYRICS_SECTIONS = [
  {
    titleWidth: 'max-w-[5.5rem]',
    lineWidths: ['max-w-[92%]', 'max-w-[88%]', 'max-w-[95%]', 'max-w-[76%]', 'max-w-[90%]', 'max-w-[84%]'],
  },
  {
    titleWidth: 'max-w-[4.5rem]',
    lineWidths: ['max-w-[94%]', 'max-w-[80%]', 'max-w-[91%]', 'max-w-[86%]', 'max-w-[72%]'],
  },
  {
    titleWidth: 'max-w-[5.5rem]',
    lineWidths: ['max-w-[90%]', 'max-w-[85%]', 'max-w-[93%]', 'max-w-[78%]', 'max-w-[88%]', 'max-w-[70%]', 'max-w-[82%]'],
  },
] as const

function EndSuggestionsSkeleton() {
  return (
    <div className="mt-8 space-y-3 border-t border-border pt-6">
      <Bone className="h-4 w-32" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-[11rem] shrink-0 space-y-2">
            <Bone className="aspect-square w-full rounded-xl" />
            <Bone className="h-4 w-[85%]" />
            <Bone className="h-3 w-[60%]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SongPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-background">
      <SongHeaderSkeleton />

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 md:px-6">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <TitleCardSkeleton />
            <ChordsSectionSkeleton />

            <div className="space-y-4">
              {LYRICS_SECTIONS.map((section, index) => (
                <LyricsSectionSkeleton
                  key={index}
                  titleWidth={section.titleWidth}
                  lineWidths={[...section.lineWidths]}
                />
              ))}
            </div>

            <EndSuggestionsSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
