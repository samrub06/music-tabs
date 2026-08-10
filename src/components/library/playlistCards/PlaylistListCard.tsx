'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCoverDominantColor } from '@/lib/hooks/useCoverDominantColor'
import { cn } from '@/lib/utils'

export type PlaylistListCardProps = {
  href: string
  title: ReactNode
  media: ReactNode
  /** Cover URL used to tint the card background and render the rotated art */
  coverUrl?: string | null
  className?: string
}

/** Compact list tile: same rotated cover treatment as artist banners, keeps short height. */
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
        'group relative flex min-h-[3rem] items-center overflow-hidden rounded-lg transition-opacity hover:opacity-90 sm:min-h-[3.5rem]',
        !tinted && 'bg-muted/80 hover:bg-muted',
        className
      )}
      style={tinted ? { backgroundColor: bg } : undefined}
    >
      <div
        className={cn(
          'relative z-10 flex min-w-0 flex-1 items-center',
          tinted ? 'max-w-[78%] px-2.5 py-1.5 sm:max-w-[76%] sm:px-3' : 'gap-2 px-0 sm:gap-2.5'
        )}
      >
        {!tinted ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-black/20 sm:h-14 sm:w-14">
            {media}
          </div>
        ) : null}
        <span
          className={cn(
            'min-w-0 flex-1 text-sm font-semibold leading-snug line-clamp-2',
            tinted
              ? 'text-white'
              : 'pr-2 text-foreground group-hover:text-primary'
          )}
        >
          {title}
        </span>
      </div>

      {tinted ? (
        <div
          className="pointer-events-none absolute inset-y-0 end-0 w-[22%] overflow-hidden sm:w-[24%]"
          aria-hidden
        >
          <div className="absolute bottom-0 end-0 h-[185%] w-[145%] translate-x-[6%] translate-y-[28%] rotate-[22deg] sm:rotate-[24deg]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full rounded-sm object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </div>
          <div
            className="absolute inset-y-0 start-0 w-2/5"
            style={{
              backgroundImage: `linear-gradient(to right, ${bg}, transparent)`,
            }}
          />
        </div>
      ) : null}
    </Link>
  )
}
