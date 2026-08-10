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

/** Artist playlist banner: tinted bg, name left, rotated cover filling the right side. */
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
          ? 'min-h-[3.75rem] min-w-0 sm:min-h-[6rem]'
          : 'min-h-[4.5rem] w-full sm:min-h-[7rem]',
        className
      )}
      style={{ backgroundColor: bg }}
    >
      <div
        className={cn(
          'relative z-10 flex min-w-0 flex-col justify-center',
          pairRow
            ? 'max-w-[68%] p-2 sm:max-w-[60%] sm:p-3'
            : 'max-w-[58%] p-2.5 sm:max-w-[55%] sm:p-3.5'
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
          pairRow ? 'w-[40%]' : 'w-[42%]'
        )}
        aria-hidden
      >
        <div
          className={cn(
            // Anchored bottom-end; hangs slightly below for a grounded look.
            'absolute bottom-0 end-0 translate-x-[10%] translate-y-[22%]',
            pairRow
              ? 'h-[125%] w-[105%] rotate-[20deg] sm:h-[145%] sm:w-[110%] sm:rotate-[24deg]'
              : 'h-[130%] w-[108%] rotate-[18deg] sm:h-[150%] sm:w-[115%] sm:rotate-[22deg]'
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full rounded-sm object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full rounded-sm bg-white/10" />
          )}
        </div>
        {/* Soft blend into the tinted title side */}
        <div
          className="absolute inset-y-0 start-0 w-2/5"
          style={{
            backgroundImage: `linear-gradient(to right, ${bg}, transparent)`,
          }}
        />
      </div>
    </Link>
  )
}
