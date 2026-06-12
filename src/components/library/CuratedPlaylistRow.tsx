'use client'

import { ClockIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import {
  CURATED_PLAYLISTS,
  curatedPlaylistSectionBySlug,
  type CuratedPlaylistSection,
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
  'yosef-karduner': 'bg-gradient-to-br from-sky-600 to-blue-900',
  akiva: 'bg-gradient-to-br from-orange-600 to-red-800',
}

const sectionTitleKey: Record<CuratedPlaylistSection, string> = {
  genre: 'library.curatedGenres',
  jewish: 'library.curatedJewish',
  decade: 'library.curatedDecades',
  difficulty: 'library.curatedDifficulty',
}

interface GridCardProps {
  href: string
  compact?: boolean
  children: ReactNode
  footer: ReactNode
}

interface PlaylistCardData {
  id: string
  href: string
  content: ReactNode
  footer: ReactNode
}

function GridCard({ href, compact = false, children, footer }: GridCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl',
        compact ? 'w-28 flex-shrink-0 sm:w-32' : 'w-full'
      )}
    >
      {children}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        {footer}
      </div>
    </Link>
  )
}

function buildPlaylistCard(item: PublicPlaylistItem, t: (key: string) => string): PlaylistCardData {
  const footer = (
    <>
      <div className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</div>
      <div className="text-white/80 text-[10px] sm:text-xs truncate">
        {t('library.playlistSongCount').replace('{count}', String(item.songCount))}
      </div>
    </>
  )

  const difficultyTheme = item.curatedSlug ? getDifficultyThemeBySlug(item.curatedSlug) : undefined

  const gradientClass =
    difficultyTheme?.gradientClass ||
    (item.curatedSlug && curatedGradientBySlug[item.curatedSlug]) ||
    'bg-gradient-to-br from-purple-500 to-pink-500'

  const isDifficultyBanner =
    !!item.curatedSlug && curatedPlaylistSectionBySlug[item.curatedSlug] === 'difficulty'

  const coverUrl = item.curatedSlug
    ? getCuratedPlaylistCoverUrl(item.curatedSlug) ?? item.imageUrl ?? null
    : item.imageUrl ?? null

  const content =
    !isDifficultyBanner && coverUrl ? (
      <div className="absolute inset-0">
        <img src={coverUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
    ) : isDifficultyBanner && difficultyTheme ? (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: difficultyTheme.bannerBg }}
      >
        <div className="absolute inset-0 flex items-center justify-center pb-3 sm:pb-4">
          <DifficultyGauge level={difficultyTheme.level} size={60} />
        </div>
      </div>
    ) : (
      <div className={cn('absolute inset-0', gradientClass)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
        </div>
      </div>
    )

  return { id: item.id, href: `/library/${item.id}`, content, footer }
}

interface ShortcutCardData {
  id: string
  href: string
  content: ReactNode
  footer: ReactNode
}

function buildCoverCardContent(coverUrl: string | null, fallback: ReactNode): ReactNode {
  if (coverUrl) {
    return (
      <div className="absolute inset-0">
        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
    )
  }

  return fallback
}

interface CuratedPlaylistRowProps {
  section: CuratedPlaylistSection
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
}

export default function CuratedPlaylistRow({
  section,
  publicPlaylists,
  showUserShortcutCards = false,
}: CuratedPlaylistRowProps) {
  const { t } = useLanguage()

  const userShortcutCards: ShortcutCardData[] = showUserShortcutCards
    ? [
        {
          id: 'liked-songs',
          href: '/songs?filter=liked',
          content: buildCoverCardContent(getLikedSongsCoverUrl(), (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <HeartIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
            </>
          )),
          footer: (
            <div className="truncate text-xs font-bold text-white sm:text-sm">
              {t('library.likedSongs')}
            </div>
          ),
        },
        {
          id: 'recent-songs',
          href: '/songs?tab=recent',
          content: buildCoverCardContent(getRecentSongsCoverUrl(), (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
            </>
          )),
          footer: (
            <div className="truncate text-xs font-bold text-white sm:text-sm">
              {t('library.myRecentSongs')}
            </div>
          ),
        },
      ]
    : []

  const cards = publicPlaylists
    .filter(
      (item) =>
        item.songCount > 0 &&
        item.curatedSlug &&
        curatedPlaylistSectionBySlug[item.curatedSlug] === section
    )
    .sort((a, b) => {
      const orderA = CURATED_PLAYLISTS.find((p) => p.slug === a.curatedSlug)?.displayOrder ?? 0
      const orderB = CURATED_PLAYLISTS.find((p) => p.slug === b.curatedSlug)?.displayOrder ?? 0
      return orderA - orderB
    })
    .map((item) => buildPlaylistCard(item, t))

  if (cards.length === 0 && userShortcutCards.length === 0) return null

  const renderCards = (compact: boolean) => (
    <>
      {userShortcutCards.map((item) => (
        <GridCard key={item.id} href={item.href} compact={compact} footer={item.footer}>
          {item.content}
        </GridCard>
      ))}
      {cards.map((item) => (
        <GridCard key={item.id} href={item.href} compact={compact} footer={item.footer}>
          {item.content}
        </GridCard>
      ))}
    </>
  )

  return (
    <section className="mb-6">
      <h3 className="mb-3 text-base font-semibold text-foreground sm:text-lg">
        {t(sectionTitleKey[section])}
      </h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {renderCards(true)}
      </div>
    </section>
  )
}
