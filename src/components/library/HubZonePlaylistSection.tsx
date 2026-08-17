'use client'

import { ClockIcon, HeartIcon } from '@heroicons/react/24/solid'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getHubZoneForSlug, type HubZone } from '@/data/curatedPlaylists'
import { isArtistPlaylistSlug } from '@/data/artistPlaylistSlugs'
import {
  getLikedSongsCoverUrl,
  getRecentSongsCoverUrl,
} from '@/data/curatedPlaylistCoverImages'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import { PlaylistArtistBanner } from '@/components/library/playlistCards/PlaylistArtistBanner'
import { PlaylistListCard } from '@/components/library/playlistCards/PlaylistListCard'
import { PlaylistSquareCard } from '@/components/library/playlistCards/PlaylistSquareCard'
import {
  buildCoverOrFallback,
  buildPlaylistCoverMedia,
  getPlaylistItemCoverUrl,
} from '@/components/library/playlistCards/playlistCardMedia'
import { SwipeRowHint } from '@/components/library/SwipeRowHint'
import {
  extractArtistBannerPair,
  ISRAELI_LIST_SLOTS,
  partitionHubPlaylists,
  sortPlaylistsByDisplayOrder,
} from '@/components/library/hubPlaylistPartition'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { cn } from '@/lib/utils'

type ShortcutCard = {
  id: string
  href: string
  title: ReactNode
  media: ReactNode
  coverUrl: string | null
}

interface HubZonePlaylistSectionProps {
  hubZone: HubZone
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
  showSwipeHint?: boolean
  /** Expand list/square shelves into a wrapping grid below banners. */
  seeAll?: boolean
  /** When set, library detail links include ?from=… for correct back navigation. */
  libraryFrom?: string
}

export function HubZonePlaylistSection({
  hubZone,
  publicPlaylists,
  showUserShortcutCards = false,
  showSwipeHint = false,
  seeAll = false,
  libraryFrom,
}: HubZonePlaylistSectionProps) {
  const { t, isRtl } = useLanguage()
  const isLandscapeMobile = useLandscapeMobile()
  const { profile } = useAuthContext()
  const tsnioutFilterEnabled = profile?.tsniout_filter_enabled ?? false
  const listScrollRef = useRef<HTMLDivElement>(null)
  const squareScrollRef = useRef<HTMLDivElement>(null)
  const peekingRef = useRef(false)
  const [hintActive, setHintActive] = useState(false)

  /** Israeli shows more cards vertically (3-row strip); other hubs stay at 2. */
  const scrollGridRows = hubZone === 'israeli' ? 3 : 2
  const scrollGridRowsClass =
    hubZone === 'israeli' ? 'grid-rows-3' : 'grid-rows-2'
  const listHintThreshold = scrollGridRows * 2

  useEffect(() => {
    if (!showSwipeHint || seeAll) return
    const start = window.setTimeout(() => setHintActive(true), 300)
    const autoHide = window.setTimeout(() => setHintActive(false), 6500)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(autoHide)
    }
  }, [showSwipeHint, seeAll])

  useEffect(() => {
    if (!showSwipeHint || !hintActive || seeAll) return
    const el = listScrollRef.current
    if (!el) return

    const onScroll = () => {
      if (peekingRef.current) return
      setHintActive(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    const peekStart = window.setTimeout(() => {
      peekingRef.current = true
      const amount = isRtl ? -96 : 96
      el.scrollBy({ left: amount, behavior: 'smooth' })
      window.setTimeout(() => {
        el.scrollBy({ left: -amount, behavior: 'smooth' })
        window.setTimeout(() => {
          peekingRef.current = false
        }, 850)
      }, 750)
    }, 500)

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(peekStart)
      peekingRef.current = false
    }
  }, [showSwipeHint, hintActive, isRtl, seeAll])

  const shortcuts: ShortcutCard[] = showUserShortcutCards
    ? [
        {
          id: 'liked-songs',
          href: '/songs?filter=liked',
          title: t('library.likedSongs'),
          coverUrl: tsnioutFilterEnabled ? null : getLikedSongsCoverUrl(),
          media: buildCoverOrFallback(
            tsnioutFilterEnabled ? null : getLikedSongsCoverUrl(),
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <HeartIcon className="h-7 w-7 text-white" />
              </div>
            </>
          ),
        },
        {
          id: 'recent-songs',
          href: '/songs?tab=recent',
          title: t('library.myRecentSongs'),
          coverUrl: tsnioutFilterEnabled ? null : getRecentSongsCoverUrl(),
          media: buildCoverOrFallback(
            tsnioutFilterEnabled ? null : getRecentSongsCoverUrl(),
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
            </>
          ),
        },
      ]
    : []

  const zonePlaylists = publicPlaylists.filter(
    (item) =>
      item.songCount > 0 &&
      !!item.curatedSlug &&
      getHubZoneForSlug(item.curatedSlug) === hubZone
  )

  const artistBanners = sortPlaylistsByDisplayOrder(
    zonePlaylists.filter((p) => isArtistPlaylistSlug(p.curatedSlug))
  )
  const { pair: artistBannerPair, rest: artistBannerRest } =
    extractArtistBannerPair(artistBanners)
  const artistIds = new Set(artistBanners.map((p) => p.id))
  const nonArtistPlaylists = zonePlaylists.filter((p) => !artistIds.has(p.id))

  const { list, square, featured } = partitionHubPlaylists(
    nonArtistPlaylists,
    shortcuts.length,
    hubZone === 'israeli' ? { listSlots: ISRAELI_LIST_SLOTS } : undefined
  )

  if (
    list.length === 0 &&
    square.length === 0 &&
    featured.length === 0 &&
    artistBanners.length === 0 &&
    shortcuts.length === 0
  ) {
    return null
  }

  const mediaOpts = { tsnioutFilterEnabled }
  const libraryHref = (id: string) =>
    libraryFrom
      ? `/library/${id}?from=${encodeURIComponent(libraryFrom)}`
      : `/library/${id}`

  const listItems = [
    ...shortcuts.map((item) => ({
      key: item.id,
      href: item.href,
      title: item.title,
      media: item.media,
      coverUrl: item.coverUrl,
    })),
    ...list.map((item) => ({
      key: item.id,
      href: libraryHref(item.id),
      title: item.name,
      media: buildPlaylistCoverMedia(item, mediaOpts),
      coverUrl: getPlaylistItemCoverUrl(item, mediaOpts),
    })),
  ]

  const scrollGridClass = cn(
    'grid grid-flow-col gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory',
    // Israeli: slightly narrower so the next page peeks. Other hubs: exact 50% pairs.
    hubZone === 'israeli'
      ? 'auto-cols-[calc((100%-1rem)/2.35)]'
      : 'auto-cols-[calc((100%-0.5rem)/2)]',
    scrollGridRowsClass
  )
  const seeAllListGridClass = 'grid grid-cols-2 gap-2'
  const scrollGridStyle = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    WebkitOverflowScrolling: 'touch' as const,
  }

  const renderPairedBanners = (items: typeof artistBanners) => (
    <div className="grid w-full grid-cols-2 gap-2">
      {items.map((item) => (
        <PlaylistArtistBanner
          key={item.id}
          href={libraryHref(item.id)}
          name={item.name}
          curatedSlug={item.curatedSlug}
          imageUrl={item.imageUrl}
          tsnioutFilterEnabled={tsnioutFilterEnabled}
          pairRow
          className="min-w-0"
        />
      ))}
    </div>
  )

  const renderArtistBannerShelf = (items: typeof artistBanners) => {
    if (items.length === 0) return null
    if (items.length === 1) {
      const item = items[0]!
      return (
        <PlaylistArtistBanner
          key={item.id}
          href={libraryHref(item.id)}
          name={item.name}
          curatedSlug={item.curatedSlug}
          imageUrl={item.imageUrl}
          tsnioutFilterEnabled={tsnioutFilterEnabled}
          className="min-w-0 w-full"
        />
      )
    }
    if (items.length === 2) return renderPairedBanners(items)
    if (seeAll) {
      return (
        <div className="grid w-full grid-cols-2 gap-2">
          {items.map((item) => (
            <PlaylistArtistBanner
              key={item.id}
              href={libraryHref(item.id)}
              name={item.name}
              curatedSlug={item.curatedSlug}
              imageUrl={item.imageUrl}
              tsnioutFilterEnabled={tsnioutFilterEnabled}
              pairRow
              className="min-w-0"
            />
          ))}
        </div>
      )
    }
    return (
      <div className={scrollGridClass} style={scrollGridStyle}>
        {items.map((item) => (
          <PlaylistArtistBanner
            key={item.id}
            href={libraryHref(item.id)}
            name={item.name}
            curatedSlug={item.curatedSlug}
            imageUrl={item.imageUrl}
            tsnioutFilterEnabled={tsnioutFilterEnabled}
            className="min-w-0 snap-start"
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-3">
      {/* Artist banners first so new FR/IL artist shelves are visible without deep scroll.
          Hassidique | Carlebach: always one mobile row (explicit pair, grid-cols-2).
          Other banners: 1 full-width, 2 side-by-side, 3+ multi-row horizontal scroll.
          Featured full-width (Top Israel, etc.): same PlaylistArtistBanner pattern. */}
      {artistBannerPair.length === 2 && renderPairedBanners(artistBannerPair)}
      {renderArtistBannerShelf(artistBannerRest)}

      {listItems.length > 0 && (
        <div className="relative">
          <div
            ref={seeAll ? undefined : listScrollRef}
            className={seeAll ? seeAllListGridClass : scrollGridClass}
            style={seeAll ? undefined : scrollGridStyle}
          >
            {listItems.map((item) => (
              <PlaylistListCard
                key={item.key}
                href={item.href}
                title={item.title}
                media={item.media}
                coverUrl={item.coverUrl}
                className={cn('min-w-0', !seeAll && 'snap-start')}
              />
            ))}
          </div>
          {!seeAll && hintActive && listItems.length > listHintThreshold && (
            <SwipeRowHint />
          )}
        </div>
      )}

      {square.length > 0 && (
        <div className="relative">
          <div
            ref={seeAll ? undefined : squareScrollRef}
            className={
              seeAll
                ? 'grid grid-cols-2 gap-2 sm:grid-cols-3'
                : 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory'
            }
            style={
              seeAll
                ? undefined
                : {
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }
            }
          >
            {square.map((item) => (
              <PlaylistSquareCard
                key={item.id}
                href={libraryHref(item.id)}
                title={item.name}
                layout={seeAll ? 'grid' : 'scroll'}
                compact={isLandscapeMobile}
                media={buildPlaylistCoverMedia(item, mediaOpts)}
                coverUrl={getPlaylistItemCoverUrl(item, mediaOpts)}
              />
            ))}
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <div className="flex flex-col gap-2">
          {featured.map((item) => (
            <PlaylistArtistBanner
              key={item.id}
              href={libraryHref(item.id)}
              name={item.name}
              curatedSlug={item.curatedSlug}
              imageUrl={item.imageUrl}
              tsnioutFilterEnabled={tsnioutFilterEnabled}
              className="min-w-0 w-full"
            />
          ))}
        </div>
      )}
    </section>
  )
}
