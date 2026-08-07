'use client'

import { ClockIcon, HeartIcon } from '@heroicons/react/24/solid'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CURATED_PLAYLISTS,
  getHubZoneForSlug,
  type HubZone,
} from '@/data/curatedPlaylists'
import { isArtistPlaylistSlug } from '@/data/artistPlaylistSlugs'
import {
  getLikedSongsCoverUrl,
  getRecentSongsCoverUrl,
} from '@/data/curatedPlaylistCoverImages'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import { PlaylistArtistBanner } from '@/components/library/playlistCards/PlaylistArtistBanner'
import { PlaylistFeaturedCard } from '@/components/library/playlistCards/PlaylistFeaturedCard'
import { PlaylistListCard } from '@/components/library/playlistCards/PlaylistListCard'
import { PlaylistSquareCard } from '@/components/library/playlistCards/PlaylistSquareCard'
import {
  buildCoverOrFallback,
  buildPlaylistCoverMedia,
  getPlaylistItemCoverUrl,
} from '@/components/library/playlistCards/playlistCardMedia'
import { SwipeRowHint } from '@/components/library/SwipeRowHint'
import {
  partitionHubPlaylists,
  sortPlaylistsByDisplayOrder,
} from '@/components/library/hubPlaylistPartition'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'

type ShortcutCard = {
  id: string
  href: string
  title: ReactNode
  media: ReactNode
  coverUrl: string | null
}

function sanitizePlaylistDescription(description?: string): string | undefined {
  if (!description) return undefined
  const cleaned = description
    .replace(/\s*\((Tab4U|Negina|Ultimate Guitar)[^)]*\)/gi, '')
    .replace(/\b(Tab4U|Negina\.co\.il|Ultimate Guitar)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || undefined
}

interface HubZonePlaylistSectionProps {
  hubZone: HubZone
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
  showSwipeHint?: boolean
}

export function HubZonePlaylistSection({
  hubZone,
  publicPlaylists,
  showUserShortcutCards = false,
  showSwipeHint = false,
}: HubZonePlaylistSectionProps) {
  const { t, isRtl } = useLanguage()
  const isLandscapeMobile = useLandscapeMobile()
  const { profile } = useAuthContext()
  const tsnioutFilterEnabled = profile?.tsniout_filter_enabled ?? false
  const listScrollRef = useRef<HTMLDivElement>(null)
  const squareScrollRef = useRef<HTMLDivElement>(null)
  const peekingRef = useRef(false)
  const [hintActive, setHintActive] = useState(false)

  useEffect(() => {
    if (!showSwipeHint) return
    const start = window.setTimeout(() => setHintActive(true), 300)
    const autoHide = window.setTimeout(() => setHintActive(false), 6500)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(autoHide)
    }
  }, [showSwipeHint])

  useEffect(() => {
    if (!showSwipeHint || !hintActive) return
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
  }, [showSwipeHint, hintActive, isRtl])

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
  const artistIds = new Set(artistBanners.map((p) => p.id))
  const nonArtistPlaylists = zonePlaylists.filter((p) => !artistIds.has(p.id))

  const { list, square, featured } = partitionHubPlaylists(
    nonArtistPlaylists,
    shortcuts.length
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
      href: `/library/${item.id}`,
      title: item.name,
      media: buildPlaylistCoverMedia(item, mediaOpts),
      coverUrl: getPlaylistItemCoverUrl(item, mediaOpts),
    })),
  ]

  return (
    <section className="mb-6 space-y-4">
      {/* Artist banners first so new FR/IL artist shelves are visible without deep scroll */}
      {artistBanners.length > 0 && (
        <div
          className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory auto-cols-[calc((100%-0.5rem)/2)]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {artistBanners.map((item) => (
            <PlaylistArtistBanner
              key={item.id}
              href={`/library/${item.id}`}
              name={item.name}
              curatedSlug={item.curatedSlug}
              imageUrl={item.imageUrl}
              tsnioutFilterEnabled={tsnioutFilterEnabled}
              className="min-w-0 snap-start"
            />
          ))}
        </div>
      )}

      {listItems.length > 0 && (
        <div className="relative">
          <div
            ref={listScrollRef}
            className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory auto-cols-[calc((100%-0.5rem)/2)]"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {listItems.map((item) => (
              <PlaylistListCard
                key={item.key}
                href={item.href}
                title={item.title}
                media={item.media}
                coverUrl={item.coverUrl}
                className="min-w-0 snap-start"
              />
            ))}
          </div>
          {hintActive && listItems.length > 4 && <SwipeRowHint />}
        </div>
      )}

      {square.length > 0 && (
        <div className="relative">
          <div
            ref={squareScrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {square.map((item) => (
              <PlaylistSquareCard
                key={item.id}
                href={`/library/${item.id}`}
                title={item.name}
                layout="scroll"
                compact={isLandscapeMobile}
                media={buildPlaylistCoverMedia(item, mediaOpts)}
                coverUrl={getPlaylistItemCoverUrl(item, mediaOpts)}
              />
            ))}
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <div className="flex flex-col gap-3">
          {featured.map((item) => {
            const def = CURATED_PLAYLISTS.find((p) => p.slug === item.curatedSlug)
            return (
              <PlaylistFeaturedCard
                key={item.id}
                href={`/library/${item.id}`}
                title={item.name}
                description={sanitizePlaylistDescription(def?.description)}
                media={buildPlaylistCoverMedia(item, mediaOpts)}
                coverUrl={getPlaylistItemCoverUrl(item, mediaOpts)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
