'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCoverDominantColor } from '@/lib/hooks/useCoverDominantColor'
import { cn } from '@/lib/utils'

export type PlaylistSquareCardProps = {
  href: string
  title: ReactNode
  media: ReactNode
  coverUrl?: string | null
  /** scroll = fixed-width shelf item; grid/landscape = fluid */
  layout?: 'scroll' | 'landscape' | 'grid'
  compact?: boolean
  className?: string
}

/** Square shelf card: cover on tinted plate from cover color. */
export function PlaylistSquareCard({
  href,
  title,
  media,
  coverUrl,
  layout = 'scroll',
  compact = false,
  className,
}: PlaylistSquareCardProps) {
  const bg = useCoverDominantColor(coverUrl, {
    fallback: 'hsl(var(--muted))',
    mix: 0.5,
  })
  const tinted = !!coverUrl

  return (
    <div
      className={cn(
        'group relative flex flex-col transition-colors',
        layout === 'scroll' &&
          cn(
            'w-24 flex-shrink-0 snap-start gap-1 sm:w-32',
            compact && 'w-20 gap-0.5 sm:w-24'
          ),
        layout === 'landscape' && 'w-full gap-1.5',
        layout === 'grid' && 'w-full gap-1',
        className
      )}
    >
      <Link
        href={href}
        className={cn(
          'relative aspect-square w-full overflow-hidden p-1.5',
          layout === 'scroll' ? 'rounded-lg' : 'rounded-xl',
          compact && 'max-h-20 sm:max-h-24',
          !tinted && 'bg-muted'
        )}
        style={tinted ? { backgroundColor: bg } : undefined}
      >
        <div className="relative h-full w-full overflow-hidden rounded-md">
          {media}
        </div>
      </Link>
      <Link
        href={href}
        className={cn(
          'min-w-0 truncate font-medium leading-tight text-foreground transition-colors group-hover:text-primary',
          compact ? 'text-[10px]' : 'text-xs sm:text-sm'
        )}
      >
        {title}
      </Link>
    </div>
  )
}
