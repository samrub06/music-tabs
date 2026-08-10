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
  /** overlay = title inside bottom-left; below = classic caption under the card */
  titlePlacement?: 'overlay' | 'below'
  className?: string
}

/** Square shelf card: cover plate; title overlay or below. */
export function PlaylistSquareCard({
  href,
  title,
  media,
  coverUrl,
  layout = 'scroll',
  compact = false,
  titlePlacement = 'overlay',
  className,
}: PlaylistSquareCardProps) {
  const bg = useCoverDominantColor(coverUrl, {
    fallback: 'hsl(var(--muted))',
    mix: 0.5,
  })
  const tinted = !!coverUrl
  const titleBelow = titlePlacement === 'below'

  if (titleBelow) {
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
            'relative aspect-square w-full overflow-hidden transition-opacity hover:opacity-95',
            layout === 'scroll' ? 'rounded-lg' : 'rounded-xl',
            compact && 'max-h-20 sm:max-h-24',
            !tinted && 'bg-muted'
          )}
          style={tinted ? { backgroundColor: bg } : undefined}
        >
          <div className="absolute inset-1.5 overflow-hidden rounded-md">{media}</div>
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

  return (
    <Link
      href={href}
      className={cn(
        'group relative block aspect-square overflow-hidden transition-opacity hover:opacity-95',
        layout === 'scroll' &&
          cn(
            'w-24 flex-shrink-0 snap-start sm:w-32',
            compact && 'w-20 max-h-20 sm:w-24 sm:max-h-24'
          ),
        layout === 'scroll' ? 'rounded-lg' : 'rounded-xl',
        (layout === 'landscape' || layout === 'grid') && 'w-full',
        !tinted && 'bg-muted',
        className
      )}
      style={tinted ? { backgroundColor: bg } : undefined}
    >
      <div className="absolute inset-1.5 overflow-hidden rounded-md">{media}</div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent pt-6 sm:pt-8"
        aria-hidden
      />
      <span
        className={cn(
          'absolute bottom-1.5 start-2 z-10 max-w-[calc(100%-1rem)] truncate font-semibold leading-tight text-white drop-shadow-sm sm:bottom-2 sm:start-2.5',
          compact ? 'text-[10px]' : 'text-xs sm:text-sm'
        )}
      >
        {title}
      </span>
    </Link>
  )
}
