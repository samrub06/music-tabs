'use client'

import { ChevronRightIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCoverDominantColor } from '@/lib/hooks/useCoverDominantColor'
import { cn } from '@/lib/utils'

export type PlaylistFeaturedCardProps = {
  href: string
  title: ReactNode
  description?: string
  media: ReactNode
  coverUrl?: string | null
  className?: string
}

/** Full-width playlist card with background tinted from cover. */
export function PlaylistFeaturedCard({
  href,
  title,
  description,
  media,
  coverUrl,
  className,
}: PlaylistFeaturedCardProps) {
  const bg = useCoverDominantColor(coverUrl, {
    fallback: 'hsl(var(--muted))',
    mix: 0.48,
  })
  const tinted = !!coverUrl

  return (
    <Link
      href={href}
      className={cn(
        'group flex w-full items-stretch gap-3 overflow-hidden rounded-2xl p-2.5 transition-opacity hover:opacity-95 sm:gap-4 sm:p-3',
        !tinted && 'bg-muted/70 hover:bg-muted',
        className
      )}
      style={tinted ? { backgroundColor: bg } : undefined}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/20 sm:h-32 sm:w-32">
        {media}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1">
        <span
          className={cn(
            'text-base font-bold leading-snug line-clamp-2 sm:text-lg',
            tinted ? 'text-white' : 'text-foreground group-hover:text-primary'
          )}
        >
          {title}
        </span>
        {description ? (
          <p
            className={cn(
              'mt-1 text-xs line-clamp-2 sm:text-sm',
              tinted ? 'text-white/75' : 'text-muted-foreground'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center self-center pr-1',
          tinted ? 'text-white/70' : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden />
      </div>
    </Link>
  )
}
