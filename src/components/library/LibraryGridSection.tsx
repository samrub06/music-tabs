'use client'

import { HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import {
  CURATED_PLAYLISTS,
  CURATED_PLAYLIST_SECTION_ORDER,
  curatedPlaylistSectionBySlug,
  type CuratedPlaylistSection,
} from '@/data/curatedPlaylists'
import type { ReactNode } from 'react'

export interface PublicPlaylistItem {
  id: string
  name: string
  imageUrl?: string
  songCount: number
  curatedSlug?: string
}

const curatedGradientBySlug = Object.fromEntries(
  CURATED_PLAYLISTS.map((p) => [p.slug, `bg-gradient-to-br ${p.gradientFrom} ${p.gradientTo}`])
) as Record<string, string>

const sectionTitleKey: Record<CuratedPlaylistSection, string> = {
  genre: 'library.curatedGenres',
  decade: 'library.curatedDecades',
  difficulty: 'library.curatedDifficulty',
}

interface LibraryGridSectionProps {
  publicPlaylists: PublicPlaylistItem[]
  showLikedCard?: boolean
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
        compact ? 'flex-shrink-0 w-36 h-24' : 'h-24 sm:h-28'
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

  const content = item.imageUrl ? (
    <>
      <div className="absolute inset-0">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
    </>
  ) : (
    <>
      <div className={cn('absolute inset-0', gradientClass)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
        </div>
      </div>
    </>
  )

  return { id: item.id, href: `/library/${item.id}`, content, footer }
}

function PlaylistRow({
  title,
  cards,
  likedCard,
}: {
  title: string
  cards: PlaylistCardData[]
  likedCard?: { content: ReactNode; footer: ReactNode }
}) {
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
    <div className="mb-5 last:mb-0">
      <h3 className="mb-3 text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide sm:hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {renderCards(true)}
      </div>
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-4">
        {renderCards(false)}
      </div>
    </div>
  )
}

export default function LibraryGridSection({ publicPlaylists, showLikedCard = true }: LibraryGridSectionProps) {
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

  const visiblePlaylists = publicPlaylists.filter((item) => item.songCount > 0)

  const playlistsBySection = CURATED_PLAYLIST_SECTION_ORDER.reduce(
    (acc, section) => {
      acc[section] = visiblePlaylists
        .filter((item) => item.curatedSlug && curatedPlaylistSectionBySlug[item.curatedSlug] === section)
        .sort((a, b) => {
          const orderA =
            CURATED_PLAYLISTS.find((p) => p.slug === a.curatedSlug)?.displayOrder ?? 0
          const orderB =
            CURATED_PLAYLISTS.find((p) => p.slug === b.curatedSlug)?.displayOrder ?? 0
          return orderA - orderB
        })
        .map((item) => buildPlaylistCard(item, t))
      return acc
    },
    {} as Record<CuratedPlaylistSection, PlaylistCardData[]>
  )

  const hasAnySection = CURATED_PLAYLIST_SECTION_ORDER.some(
    (section) => playlistsBySection[section].length > 0
  )

  if (!hasAnySection && !likedCard) {
    return null
  }

  return (
    <section className="mb-6">
      {CURATED_PLAYLIST_SECTION_ORDER.map((section, index) => (
        <PlaylistRow
          key={section}
          title={t(sectionTitleKey[section])}
          cards={playlistsBySection[section]}
          likedCard={index === 0 ? likedCard : undefined}
        />
      ))}
    </section>
  )
}
