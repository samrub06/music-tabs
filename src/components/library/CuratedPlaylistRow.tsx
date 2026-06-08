'use client'

import { HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import {
  CURATED_PLAYLISTS,
  curatedPlaylistSectionBySlug,
  type CuratedPlaylistSection,
} from '@/data/curatedPlaylists'
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
  comedy: 'bg-gradient-to-br from-yellow-500 to-amber-600',
  disco: 'bg-gradient-to-br from-pink-600 to-rose-700',
  '50s': 'bg-gradient-to-br from-amber-800 to-yellow-900',
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
}

const sectionTitleKey: Record<CuratedPlaylistSection, string> = {
  genre: 'library.curatedGenres',
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
        'group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl',
        compact ? 'flex-shrink-0 w-36 h-24 sm:w-40 sm:h-28' : 'h-24 sm:h-28'
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

  const gradientClass =
    (item.curatedSlug && curatedGradientBySlug[item.curatedSlug]) ||
    'bg-gradient-to-br from-purple-500 to-pink-500'

  const gradientOnly =
    !!item.curatedSlug && curatedPlaylistSectionBySlug[item.curatedSlug] === 'difficulty'

  const content =
    !gradientOnly && item.imageUrl ? (
      <div className="absolute inset-0">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
    ) : (
      <div className={cn('absolute inset-0', gradientClass)}>
        {!gradientOnly && (
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
        )}
      </div>
    )

  return { id: item.id, href: `/library/${item.id}`, content, footer }
}

interface CuratedPlaylistRowProps {
  section: CuratedPlaylistSection
  publicPlaylists: PublicPlaylistItem[]
  showLikedCard?: boolean
}

export default function CuratedPlaylistRow({
  section,
  publicPlaylists,
  showLikedCard = false,
}: CuratedPlaylistRowProps) {
  const { t } = useLanguage()

  const likedCard = showLikedCard
    ? {
        content: (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </>
        ),
        footer: (
          <div className="font-bold text-white text-xs sm:text-sm truncate">{t('library.likedSongs')}</div>
        ),
      }
    : undefined

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

  if (cards.length === 0 && !likedCard) return null

  const renderCards = (compact: boolean) => (
    <>
      {likedCard && (
        <GridCard href="/songs?filter=liked" compact={compact} footer={likedCard.footer}>
          {likedCard.content}
        </GridCard>
      )}
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
