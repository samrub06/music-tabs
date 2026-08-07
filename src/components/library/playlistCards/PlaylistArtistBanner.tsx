'use client'

import Link from 'next/link'
import {
  CURATED_PLAYLIST_FORCED_BANNER_BG_BY_SLUG,
  CURATED_PLAYLIST_FORCED_BANNER_TITLE_CLASS_BY_SLUG,
} from '@/components/library/playlistCards/curatedPlaylistGradients'
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
  const forcedBg =
    curatedSlug != null
      ? CURATED_PLAYLIST_FORCED_BANNER_BG_BY_SLUG[curatedSlug]
      : undefined
  const forcedTitleClass =
    curatedSlug != null
      ? CURATED_PLAYLIST_FORCED_BANNER_TITLE_CLASS_BY_SLUG[curatedSlug]
      : undefined
  const dominantBg = useCoverDominantColor(forcedBg ? null : coverUrl)
  const bg = forcedBg ?? dominantBg

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex overflow-hidden rounded-xl transition-opacity hover:opacity-95',
        // Avoid `w-full` in pairRow: two 100%-width flex children can stack/wrap
        // on mobile instead of sharing one row.
        pairRow
          ? 'min-h-[5.25rem] min-w-0 sm:min-h-[7rem]'
          : 'min-h-[6.5rem] w-full sm:min-h-[8.25rem]',
        className
      )}
      style={{ backgroundColor: bg }}
    >
      <div
        className={cn(
          'relative z-10 flex min-w-0 flex-col justify-center',
          pairRow
            ? 'max-w-[62%] p-2 sm:max-w-[55%] sm:p-3'
            : 'max-w-[50%] p-2.5 sm:max-w-[50%] sm:p-3.5'
        )}
      >
        <h3
          className={cn(
            'font-bold leading-tight line-clamp-2',
            forcedTitleClass ?? 'text-white',
            pairRow ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          )}
        >
          {name}
        </h3>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 end-0 overflow-hidden',
          pairRow ? 'w-[48%]' : 'w-[50%]'
        )}
        aria-hidden
      >
        <div
          className={cn(
            'absolute',
            pairRow
              ? '-bottom-4 -end-3 sm:-bottom-6 sm:-end-2'
              : '-bottom-7 -end-4 sm:-bottom-11 sm:-end-5'
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className={cn(
                'rounded-lg object-cover shadow-lg ring-1 ring-white/15',
                pairRow
                  ? 'h-16 w-16 rotate-[18deg] sm:h-24 sm:w-24 sm:rotate-[22deg]'
                  : 'h-32 w-32 rotate-[10deg] sm:h-44 sm:w-44 sm:rotate-[12deg]'
              )}
            />
          ) : (
            <div
              className={cn(
                'rounded-lg bg-white/10',
                pairRow
                  ? 'h-16 w-16 rotate-[18deg] sm:h-24 sm:w-24 sm:rotate-[22deg]'
                  : 'h-32 w-32 rotate-[10deg] sm:h-44 sm:w-44 sm:rotate-[12deg]'
              )}
            />
          )}
        </div>
      </div>
    </Link>
  )
}
