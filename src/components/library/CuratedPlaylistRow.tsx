'use client'

import { ClockIcon, HeartIcon } from '@heroicons/react/24/solid'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import {
  CURATED_PLAYLISTS,
  curatedPlaylistSectionBySlug,
  type CuratedPlaylistSection,
} from '@/data/curatedPlaylists'
import {
  getLikedSongsCoverUrl,
  getRecentSongsCoverUrl,
} from '@/data/curatedPlaylistCoverImages'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import { PlaylistSquareCard } from '@/components/library/playlistCards/PlaylistSquareCard'
import {
  buildCoverOrFallback,
  buildPlaylistCoverMedia,
  getPlaylistItemCoverUrl,
} from '@/components/library/playlistCards/playlistCardMedia'
import { useAuthContext } from '@/context/AuthContext'
import { SwipeRowHint } from '@/components/library/SwipeRowHint'

const sectionTitleKey: Record<CuratedPlaylistSection, string> = {
  genre: 'library.curatedGenres',
  jewish: 'library.curatedJewish',
  decade: 'library.curatedDecades',
  difficulty: 'library.curatedDifficulty',
}

interface ShortcutCardData {
  id: string
  href: string
  media: ReactNode
  title: ReactNode
  coverUrl: string | null
}

interface CuratedPlaylistRowProps {
  section: CuratedPlaylistSection
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
  showSectionTitle?: boolean
  /** Mobile-only finger swipe overlay teaching horizontal scroll (first row). */
  showSwipeHint?: boolean
}

export default function CuratedPlaylistRow({
  section,
  publicPlaylists,
  showUserShortcutCards = false,
  showSectionTitle = true,
  showSwipeHint = false,
}: CuratedPlaylistRowProps) {
  const { t, isRtl } = useLanguage()
  const isLandscapeMobile = useLandscapeMobile()
  const { profile } = useAuthContext()
  const tsnioutFilterEnabled = profile?.tsniout_filter_enabled ?? false
  const scrollRef = useRef<HTMLDivElement>(null)
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
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      if (peekingRef.current) return
      setHintActive(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    const peekStart = window.setTimeout(() => {
      peekingRef.current = true
      const amount = isRtl ? -72 : 72
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

  const userShortcutCards: ShortcutCardData[] = showUserShortcutCards
    ? [
        {
          id: 'liked-songs',
          href: '/songs?filter=liked',
          coverUrl: tsnioutFilterEnabled ? null : getLikedSongsCoverUrl(),
          media: buildCoverOrFallback(
            tsnioutFilterEnabled ? null : getLikedSongsCoverUrl(),
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <HeartIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>
            </>
          ),
          title: t('library.likedSongs'),
        },
        {
          id: 'recent-songs',
          href: '/songs?tab=recent',
          coverUrl: tsnioutFilterEnabled ? null : getRecentSongsCoverUrl(),
          media: buildCoverOrFallback(
            tsnioutFilterEnabled ? null : getRecentSongsCoverUrl(),
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>
            </>
          ),
          title: t('library.myRecentSongs'),
        },
      ]
    : []

  const isDifficultySection = section === 'difficulty'

  const filteredPlaylists = publicPlaylists
    .filter((item) => {
      if (item.songCount <= 0 || !item.curatedSlug) return false
      return curatedPlaylistSectionBySlug[item.curatedSlug] === section
    })
    .sort((a, b) => {
      const orderA = CURATED_PLAYLISTS.find((p) => p.slug === a.curatedSlug)?.displayOrder ?? 0
      const orderB = CURATED_PLAYLISTS.find((p) => p.slug === b.curatedSlug)?.displayOrder ?? 0
      return orderA - orderB
    })

  if (filteredPlaylists.length === 0 && userShortcutCards.length === 0) return null

  const mediaOpts = {
    tsnioutFilterEnabled,
    gaugeSize: isDifficultySection ? (isLandscapeMobile ? 64 : 76) : 72,
  }

  const renderSquareCards = (
    layout: 'scroll' | 'landscape' | 'grid',
    compact = false
  ) => (
    <>
      {layout === 'scroll' &&
        userShortcutCards.map((item) => (
          <PlaylistSquareCard
            key={item.id}
            href={item.href}
            layout={layout}
            compact={compact}
            title={item.title}
            media={item.media}
            coverUrl={item.coverUrl}
          />
        ))}
      {filteredPlaylists.map((item) => (
        <PlaylistSquareCard
          key={item.id}
          href={`/library/${item.id}`}
          layout={layout}
          compact={compact}
          title={item.name}
          media={buildPlaylistCoverMedia(item, mediaOpts)}
          coverUrl={getPlaylistItemCoverUrl(item, mediaOpts)}
          titlePlacement={isDifficultySection ? 'below' : 'overlay'}
        />
      ))}
    </>
  )

  const useMobileCarousel = !isDifficultySection || isLandscapeMobile

  return (
    <section className="mb-6">
      {showSectionTitle && (
        <h3 className="mb-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {t(sectionTitleKey[section])}
        </h3>
      )}
      {useMobileCarousel ? (
        <div className="relative lg:hidden">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {renderSquareCards('scroll', isLandscapeMobile)}
          </div>
          {hintActive && <SwipeRowHint />}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 lg:hidden">{renderSquareCards('grid')}</div>
      )}
      <div
        className={cn(
          'hidden gap-3 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(7.5rem,8.5rem))]'
        )}
      >
        {renderSquareCards('landscape')}
      </div>
    </section>
  )
}
