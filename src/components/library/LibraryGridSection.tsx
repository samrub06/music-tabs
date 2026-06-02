'use client'

import { HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import type { ReactNode } from 'react'

export interface PublicPlaylistItem {
  id: string
  name: string
  imageUrl?: string
  songCount: number
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

export default function LibraryGridSection({ publicPlaylists, showLikedCard = true }: LibraryGridSectionProps) {
  const { t } = useLanguage()
  const likedFooter = (
    <>
      <div className="font-bold text-white text-xs sm:text-sm truncate">{t('library.likedSongs')}</div>
    </>
  )

  const likedCardContent = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
      <div className="absolute inset-0 flex items-center justify-center">
        <HeartIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
      </div>
    </>
  )

  const playlistCards = publicPlaylists.map((item) => {
    const footer = (
      <>
        <div className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</div>
        <div className="text-white/80 text-[10px] sm:text-xs truncate">
          Playlist · {item.songCount} {item.songCount === 1 ? 'chanson' : 'chansons'}
        </div>
      </>
    )

    const content = item.imageUrl ? (
      <>
        <div className="absolute inset-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        </div>
      </>
    ) : (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
        </div>
      </>
    )

    return { id: item.id, href: `/library/${item.id}`, content, footer }
  })

  const hasLiked = showLikedCard
  const totalCount = (hasLiked ? 1 : 0) + playlistCards.length

  if (totalCount === 0) {
    return null
  }

  const renderCards = (compact: boolean) => (
    <>
      {hasLiked && (
        <GridCard href="/songs?filter=liked" compact={compact} footer={likedFooter}>
          {likedCardContent}
        </GridCard>
      )}
      {playlistCards.map((item) => (
        <GridCard key={item.id} href={item.href} compact={compact} footer={item.footer}>
          {item.content}
        </GridCard>
      ))}
    </>
  )

  return (
    <div className="mb-6">
      {/* Mobile: horizontal scroll row */}
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

      {/* Tablet and up: grid */}
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-4">
        {renderCards(false)}
      </div>
    </div>
  )
}
