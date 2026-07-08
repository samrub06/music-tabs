'use client'

import { ClockIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import {
  CURATED_PLAYLISTS,
  curatedPlaylistSectionBySlug,
  getHubZoneForSlug,
  type CuratedPlaylistSection,
  type HubZone,
} from '@/data/curatedPlaylists'
import {
  getCuratedPlaylistCoverUrl,
  getLikedSongsCoverUrl,
  getRecentSongsCoverUrl,
} from '@/data/curatedPlaylistCoverImages'
import { DifficultyGauge } from '@/components/library/DifficultyGauge'
import { getDifficultyThemeBySlug } from '@/lib/constants/difficultyTheme'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import type { ReactNode } from 'react'

/** Full class strings so Tailwind includes gradient utilities (no dynamic concat). */
const curatedGradientBySlug: Record<string, string> = {
  rock: 'bg-gradient-to-br from-red-600 to-orange-700',
  pop: 'bg-gradient-to-br from-pink-500 to-purple-600',
  metal: 'bg-gradient-to-br from-zinc-700 to-neutral-900',
  folk: 'bg-gradient-to-br from-amber-600 to-yellow-700',
  country: 'bg-gradient-to-br from-amber-700 to-orange-800',
  soundtrack: 'bg-gradient-to-br from-violet-600 to-indigo-800',
  'rnb-funk-soul': 'bg-gradient-to-br from-purple-600 to-fuchsia-800',
  religious: 'bg-gradient-to-br from-sky-600 to-blue-800',
  'hip-hop': 'bg-gradient-to-br from-stone-700 to-gray-900',
  electronic: 'bg-gradient-to-br from-cyan-600 to-blue-700',
  'world-music': 'bg-gradient-to-br from-teal-600 to-emerald-800',
  classical: 'bg-gradient-to-br from-slate-600 to-slate-900',
  jazz: 'bg-gradient-to-br from-blue-700 to-indigo-900',
  reggae: 'bg-gradient-to-br from-green-600 to-emerald-800',
  blues: 'bg-gradient-to-br from-blue-800 to-indigo-950',
  disco: 'bg-gradient-to-br from-pink-600 to-rose-700',
  '60s': 'bg-gradient-to-br from-orange-700 to-red-900',
  '70s': 'bg-gradient-to-br from-rose-700 to-orange-900',
  '80s': 'bg-gradient-to-br from-fuchsia-700 to-purple-900',
  '90s': 'bg-gradient-to-br from-indigo-600 to-violet-700',
  '2000s': 'bg-gradient-to-br from-sky-600 to-blue-800',
  '2010s': 'bg-gradient-to-br from-cyan-600 to-teal-800',
  '2020s': 'bg-gradient-to-br from-fuchsia-600 to-pink-700',
  'absolute-beginner': 'bg-gradient-to-br from-lime-500 to-green-600',
  beginner: 'bg-gradient-to-br from-emerald-600 to-teal-700',
  intermediate: 'bg-gradient-to-br from-amber-500 to-orange-600',
  advanced: 'bg-gradient-to-br from-rose-600 to-red-800',
  'chabad-nigunim': 'bg-gradient-to-br from-blue-700 to-indigo-900',
  hassidic: 'bg-gradient-to-br from-amber-700 to-orange-900',
  carlebach: 'bg-gradient-to-br from-emerald-700 to-green-900',
  'moroccan-piyut': 'bg-gradient-to-br from-red-700 to-rose-900',
  tunisian: 'bg-gradient-to-br from-yellow-600 to-amber-800',
  'modern-israeli': 'bg-gradient-to-br from-violet-600 to-fuchsia-800',
  'ishay-ribo': 'bg-gradient-to-br from-indigo-600 to-violet-800',
  'yosef-karduner': 'bg-gradient-to-br from-sky-600 to-blue-900',
  akiva: 'bg-gradient-to-br from-orange-600 to-red-800',
  'jewish-songbook': 'bg-gradient-to-br from-teal-700 to-cyan-900',
}

const sectionTitleKey: Record<CuratedPlaylistSection, string> = {
  genre: 'library.curatedGenres',
  jewish: 'library.curatedJewish',
  decade: 'library.curatedDecades',
  difficulty: 'library.curatedDifficulty',
}

interface GridCardProps {
  href: string
  layout?: 'scroll' | 'landscape' | 'grid'
  title: ReactNode
  children: ReactNode
}

interface PlaylistCardData {
  id: string
  href: string
  content: ReactNode
  title: ReactNode
}

function GridCard({ href, layout = 'scroll', title, children }: GridCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex cursor-pointer flex-col transition-colors',
        layout === 'scroll' && 'w-28 flex-shrink-0 snap-start gap-1',
        layout === 'landscape' && 'w-full gap-2',
        layout === 'grid' && 'w-full gap-1'
      )}
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden bg-muted',
          layout === 'scroll' ? 'rounded-lg' : 'rounded-xl'
        )}
      >
        {children}
      </div>
      <div className="min-w-0 truncate text-xs font-medium leading-tight text-foreground transition-colors group-hover:text-primary sm:text-sm">
        {title}
      </div>
    </Link>
  )
}

function buildPlaylistCard(item: PublicPlaylistItem, options?: { gaugeSize?: number }): PlaylistCardData {
  const title = item.name

  const difficultyTheme = item.curatedSlug ? getDifficultyThemeBySlug(item.curatedSlug) : undefined

  const gradientClass =
    difficultyTheme?.gradientClass ||
    (item.curatedSlug && curatedGradientBySlug[item.curatedSlug]) ||
    'bg-gradient-to-br from-purple-500 to-pink-500'

  const isDifficultyBanner =
    !!item.curatedSlug && curatedPlaylistSectionBySlug[item.curatedSlug] === 'difficulty'

  const coverUrl = item.curatedSlug
    ? item.imageUrl ?? getCuratedPlaylistCoverUrl(item.curatedSlug) ?? null
    : item.imageUrl ?? null

  const content =
    !isDifficultyBanner && coverUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={item.name}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    ) : isDifficultyBanner && difficultyTheme ? (
      <div className="absolute inset-0" style={{ backgroundColor: difficultyTheme.bannerBg }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <DifficultyGauge level={difficultyTheme.level} size={options?.gaugeSize ?? 72} />
        </div>
      </div>
    ) : (
      <div className={cn('absolute inset-0', gradientClass)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
        </div>
      </div>
    )

  return { id: item.id, href: `/library/${item.id}`, content, title }
}

interface ShortcutCardData {
  id: string
  href: string
  content: ReactNode
  title: ReactNode
}

function buildCoverCardContent(coverUrl: string | null, fallback: ReactNode): ReactNode {
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

interface CuratedPlaylistRowProps {
  section?: CuratedPlaylistSection
  hubZone?: HubZone
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
  /** When false, only the card row is rendered (parent supplies HubZoneHeader). */
  showSectionTitle?: boolean
}

export default function CuratedPlaylistRow({
  section,
  hubZone,
  publicPlaylists,
  showUserShortcutCards = false,
  showSectionTitle = true,
}: CuratedPlaylistRowProps) {
  const { t } = useLanguage()

  if (!section && !hubZone) {
    throw new Error('CuratedPlaylistRow requires section or hubZone')
  }

  const userShortcutCards: ShortcutCardData[] = showUserShortcutCards
    ? [
        {
          id: 'liked-songs',
          href: '/songs?filter=liked',
          content: buildCoverCardContent(getLikedSongsCoverUrl(), (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <HeartIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>
            </>
          )),
          title: t('library.likedSongs'),
        },
        {
          id: 'recent-songs',
          href: '/songs?tab=recent',
          content: buildCoverCardContent(getRecentSongsCoverUrl(), (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>
            </>
          )),
          title: t('library.myRecentSongs'),
        },
      ]
    : []

  const isDifficultySection = section === 'difficulty'

  const filteredPlaylists = publicPlaylists
    .filter((item) => {
      if (item.songCount <= 0 || !item.curatedSlug) return false
      if (hubZone) return getHubZoneForSlug(item.curatedSlug) === hubZone
      if (section) return curatedPlaylistSectionBySlug[item.curatedSlug] === section
      return false
    })
    .sort((a, b) => {
      const orderA = CURATED_PLAYLISTS.find((p) => p.slug === a.curatedSlug)?.displayOrder ?? 0
      const orderB = CURATED_PLAYLISTS.find((p) => p.slug === b.curatedSlug)?.displayOrder ?? 0
      return orderA - orderB
    })

  const buildCards = (options?: { gaugeSize?: number }) =>
    filteredPlaylists.map((item) => buildPlaylistCard(item, options))

  const cards = buildCards()
  const mobileGridCards = isDifficultySection ? buildCards({ gaugeSize: 56 }) : cards

  if (cards.length === 0 && userShortcutCards.length === 0) return null

  type CardLayout = NonNullable<GridCardProps['layout']>

  const renderCards = (
    layout: CardLayout,
    playlistCards: PlaylistCardData[] = layout === 'grid' ? mobileGridCards : cards
  ) => {

    return (
      <>
        {layout === 'scroll' &&
          userShortcutCards.map((item) => (
            <GridCard key={item.id} href={item.href} layout={layout} title={item.title}>
              {item.content}
            </GridCard>
          ))}
        {playlistCards.map((item) => (
          <GridCard key={item.id} href={item.href} layout={layout} title={item.title}>
            {item.content}
          </GridCard>
        ))}
      </>
    )
  }

  return (
    <section className="mb-6">
      {showSectionTitle && section && (
        <h3 className="mb-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {t(sectionTitleKey[section])}
        </h3>
      )}
      {isDifficultySection ? (
        <div className="grid grid-cols-4 gap-2 md:hidden">
          {renderCards('grid')}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {renderCards('scroll')}
        </div>
      )}
      <div
        className={cn(
          'hidden gap-4 md:grid',
          isDifficultySection
            ? 'md:grid-cols-4'
            : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
        )}
      >
        {renderCards('landscape', cards)}
      </div>
    </section>
  )
}
