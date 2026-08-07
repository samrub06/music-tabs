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
  /** Tighter layout for two banners side-by-side on one mobile row. */
  pairRow?: boolean
  className?: string
}

/** Spotify-style artist playlist banner: tinted bg, name left, rotated cover right. */
export function PlaylistArtistBanner({
  href,
  name,
  curatedSlug,
  imageUrl,
  tsnioutFilterEnabled = false,
  pairRow = false,
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
        'group relative flex overflow-hidden rounded-xl transition-opacity hover:opacity-95',
        pairRow
          ? 'min-h-[5.25rem] w-full min-w-0 sm:min-h-[7rem]'
          : 'min-h-[6.5rem] sm:min-h-[8.25rem]',
        className
      )}
      style={{ backgroundColor: bg }}
    >
      <div
        className={cn(
          'relative z-10 flex min-w-0 flex-col justify-center',
          pairRow
            ? 'max-w-[62%] p-2 sm:max-w-[55%] sm:p-3'
            : 'max-w-[58%] p-2.5 sm:max-w-[55%] sm:p-3.5'
        )}
      >
        <h3
          className={cn(
            'font-bold leading-tight text-white line-clamp-2',
            pairRow ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          )}
        >
          {name}
        </h3>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-[48%] overflow-hidden"
        aria-hidden
      >
        <div
          className={cn(
            'absolute',
            pairRow
              ? '-bottom-4 -end-3 sm:-bottom-6 sm:-end-2'
              : '-bottom-5 -end-2.5 sm:-bottom-8 sm:-end-2'
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className={cn(
                'rotate-[18deg] rounded-lg object-cover shadow-lg ring-1 ring-white/15 sm:rotate-[22deg]',
                pairRow
                  ? 'h-16 w-16 sm:h-24 sm:w-24'
                  : 'h-24 w-24 sm:h-32 sm:w-32'
              )}
            />
          ) : (
            <div
              className={cn(
                'rotate-[18deg] rounded-lg bg-white/10',
                pairRow
                  ? 'h-16 w-16 sm:h-24 sm:w-24'
                  : 'h-24 w-24 sm:h-32 sm:w-32'
              )}
            />
          )}
        </div>
      </div>
    </Link>
  )
}
