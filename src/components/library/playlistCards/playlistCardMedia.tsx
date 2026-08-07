'use client'

import { SparklesIcon } from '@heroicons/react/24/solid'
import type { ReactNode } from 'react'
import { DifficultyGauge } from '@/components/library/DifficultyGauge'
import { curatedPlaylistSectionBySlug } from '@/data/curatedPlaylists'
import { getDifficultyThemeBySlug } from '@/lib/constants/difficultyTheme'
import { cn } from '@/lib/utils'
import { resolvePlaylistCoverUrl } from '@/utils/playlistCover'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import { getCuratedPlaylistGradientClass } from './curatedPlaylistGradients'

export type PlaylistCardMediaOptions = {
  tsnioutFilterEnabled?: boolean
  gaugeSize?: number
}

export function getPlaylistItemCoverUrl(
  item: PublicPlaylistItem,
  options?: PlaylistCardMediaOptions
): string | null {
  return resolvePlaylistCoverUrl({
    name: item.name,
    imageUrl: item.imageUrl,
    curatedSlug: item.curatedSlug,
    tsnioutFilterEnabled: options?.tsnioutFilterEnabled ?? false,
  })
}

export function buildPlaylistCoverMedia(
  item: PublicPlaylistItem,
  options?: PlaylistCardMediaOptions
): ReactNode {
  const difficultyTheme = item.curatedSlug
    ? getDifficultyThemeBySlug(item.curatedSlug)
    : undefined

  const isDifficultyBanner =
    !!item.curatedSlug &&
    curatedPlaylistSectionBySlug[item.curatedSlug] === 'difficulty'

  const coverUrl = getPlaylistItemCoverUrl(item, options)

  if (!isDifficultyBanner && coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    )
  }

  if (isDifficultyBanner && difficultyTheme) {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: difficultyTheme.bannerBg }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <DifficultyGauge level={difficultyTheme.level} size={options?.gaugeSize ?? 72} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'absolute inset-0',
        difficultyTheme?.gradientClass || getCuratedPlaylistGradientClass(item.curatedSlug)
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <SparklesIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
      </div>
    </div>
  )
}

export function buildCoverOrFallback(
  coverUrl: string | null,
  fallback: ReactNode
): ReactNode {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    )
  }
  return fallback
}
