'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

type SongCoverPlaceholderProps = {
  className?: string
  iconClassName?: string
}

export function SongCoverPlaceholder({ className, iconClassName }: SongCoverPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-muted-foreground/40 via-muted to-muted-foreground/25',
        className
      )}
      aria-hidden
    >
      <MusicalNoteIcon
        className={cn(
          'h-[42%] w-[42%] min-h-9 min-w-9 max-h-16 max-w-16 text-foreground/30 dark:text-foreground/40',
          iconClassName
        )}
      />
    </div>
  )
}
