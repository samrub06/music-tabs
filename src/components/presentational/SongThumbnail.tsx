'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { resolveSongCoverUrl } from '@/utils/songCover'
import type { SongCoverInput } from '@/utils/songCover'

type SongThumbnailProps = SongCoverInput & {
  alt?: string
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  xs: 'h-8 w-8 rounded-lg sm:h-10 sm:w-10',
  sm: 'h-11 w-11 rounded-lg',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-16 w-16 rounded-xl sm:h-[4.5rem] sm:w-[4.5rem]',
} as const

const iconClasses = {
  xs: 'h-5 w-5 sm:h-6 sm:w-6',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-9 w-9 sm:h-10 sm:w-10',
} as const

/** Unfiltered cover URL (server components / no profile context). */
export function getSongCoverUrl(
  songImageUrl?: string | null,
  artistImageUrl?: string | null
): string | undefined {
  return resolveSongCoverUrl({ songImageUrl, artistImageUrl, tsnioutFilterEnabled: false })
}

export function SongThumbnail({
  songImageUrl,
  artistImageUrl,
  genre,
  alt = '',
  className,
  size = 'md',
}: SongThumbnailProps) {
  const url = useSongCover({ songImageUrl, artistImageUrl, genre })

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={cn('shrink-0 object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-muted-foreground/40 via-muted to-muted-foreground/25',
        sizeClasses[size],
        className
      )}
      aria-hidden={!alt}
    >
      <MusicalNoteIcon className={cn('text-foreground/30 dark:text-foreground/40', iconClasses[size])} />
    </div>
  )
}
