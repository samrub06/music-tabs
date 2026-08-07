'use client'

import Link from 'next/link'
import { useCoverDominantColor } from '@/lib/hooks/useCoverDominantColor'
import { cn } from '@/lib/utils'
import { resolvePlaylistCoverUrl } from '@/utils/playlistCover'

export type PlaylistArtistBannerProps = {
  href: string
  name: string
  curatedSlug?: string
  imageUrl?: string
  tsnioutFilterEnabled?: boolean
  className?: string
}

/** Spotify-style artist playlist banner: tinted bg, name left, rotated cover right. */
export function PlaylistArtistBanner({
  href,
  name,
  curatedSlug,
  imageUrl,
  tsnioutFilterEnabled = false,
  className,
}: PlaylistArtistBannerProps) {
  const coverUrl = resolvePlaylistCoverUrl({
    name,
    imageUrl,
    curatedSlug,
    tsnioutFilterEnabled,
  })
  const bg = useCoverDominantColor(coverUrl)

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-h-[7.5rem] overflow-hidden rounded-xl transition-opacity hover:opacity-95 sm:min-h-[8.25rem]',
        className
      )}
      style={{ backgroundColor: bg }}
    >
      <div className="relative z-10 flex min-w-0 max-w-[58%] flex-col justify-center p-3 sm:max-w-[55%] sm:p-3.5">
        <h3 className="text-sm font-bold leading-tight text-white line-clamp-2 sm:text-base">
          {name}
        </h3>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-[48%] overflow-hidden"
        aria-hidden
      >
        <div className="absolute -bottom-6 -end-3 sm:-bottom-8 sm:-end-2">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-28 w-28 rotate-[18deg] rounded-lg object-cover shadow-lg ring-1 ring-white/15 sm:h-32 sm:w-32 sm:rotate-[22deg]"
            />
          ) : (
            <div className="h-28 w-28 rotate-[18deg] rounded-lg bg-white/10 sm:h-32 sm:w-32" />
          )}
        </div>
      </div>
    </Link>
  )
}
