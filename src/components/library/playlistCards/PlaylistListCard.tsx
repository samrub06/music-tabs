'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCoverDominantColor } from '@/lib/hooks/useCoverDominantColor'
import { cn } from '@/lib/utils'

export type PlaylistListCardProps = {
  href: string
  title: ReactNode
  media: ReactNode
  /** Cover URL used to tint the card background */
  coverUrl?: string | null
  className?: string
}

/** Compact Spotify-style list tile: cover left + title, bg from cover color. */
export function PlaylistListCard({
  href,
  title,
  media,
  coverUrl,
  className,
}: PlaylistListCardProps) {
  const bg = useCoverDominantColor(coverUrl, {
    fallback: 'hsl(var(--muted))',
    mix: 0.55,
  })
  const tinted = !!coverUrl

  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[3.5rem] items-center gap-2.5 overflow-hidden rounded-lg transition-opacity hover:opacity-90',
        !tinted && 'bg-muted/80 hover:bg-muted',
        className
      )}
      style={tinted ? { backgroundColor: bg } : undefined}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-black/20 sm:h-16 sm:w-16">
        {media}
      </div>
      <span
        className={cn(
          'min-w-0 flex-1 pr-2 text-sm font-semibold leading-snug line-clamp-2',
          tinted
            ? 'text-white'
            : 'text-foreground group-hover:text-primary'
        )}
      >
        {title}
      </span>
    </Link>
  )
}
