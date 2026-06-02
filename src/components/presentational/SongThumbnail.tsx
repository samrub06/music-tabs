'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

type SongThumbnailProps = {
  songImageUrl?: string | null
  artistImageUrl?: string | null
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
  xs: 'h-4 w-4 sm:h-5 sm:w-5',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
} as const

export function getSongCoverUrl(
  songImageUrl?: string | null,
  artistImageUrl?: string | null
): string | undefined {
  return songImageUrl || artistImageUrl || undefined
}

export function SongThumbnail({
  songImageUrl,
  artistImageUrl,
  alt = '',
  className,
  size = 'md',
}: SongThumbnailProps) {
  const url = getSongCoverUrl(songImageUrl, artistImageUrl)

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
        'flex shrink-0 items-center justify-center bg-muted',
        sizeClasses[size],
        className
      )}
      aria-hidden={!alt}
    >
      <MusicalNoteIcon className={cn('text-muted-foreground', iconClasses[size])} />
    </div>
  )
}
