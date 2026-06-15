'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { Song } from '@/types'
import Link from 'next/link'
import { PlayIcon, PlusIcon } from '@heroicons/react/24/solid'
import { useRef } from 'react'

export interface SongLibraryStatus {
  label: string
  href?: string
  actionLabel?: string
  variant?: 'inLibrary' | 'notInLibrary'
}

const FALLBACK_SLIDER_COVER =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'

function HorizontalSongSlide({
  song,
  libraryStatus,
  onAddClick,
  addingId,
}: {
  song: Song
  libraryStatus: SongLibraryStatus | null
  onAddClick?: (song: Song) => void
  addingId?: string | null
}) {
  const { t } = useLanguage()
  const coverUrl = useSongCover(song)
  const imageUrl = coverUrl || FALLBACK_SLIDER_COVER

  return (
    <div className="group relative w-40 flex-shrink-0 sm:w-48">
      <Link href={`/song/${song.id}`}>
        <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
          <img src={imageUrl} alt={song.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg">
                <PlayIcon className="ml-1 h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-1">
        <Link href={`/song/${song.id}`}>
          <h3 className="mb-1 truncate text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100 sm:text-base">
            {song.title}
          </h3>
        </Link>
        <p className="mb-2 truncate text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{song.author}</p>
        {libraryStatus?.variant === 'inLibrary' ? (
          libraryStatus.href ? (
            <Link
              href={libraryStatus.href}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-green-100 px-3 py-1.5 text-xs text-green-800 transition-colors hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60 sm:text-sm"
            >
              <span>{libraryStatus.actionLabel ?? libraryStatus.label}</span>
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center rounded-md bg-green-100 px-3 py-1.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300 sm:text-sm">
              <span>{libraryStatus.label}</span>
            </div>
          )
        ) : (
          <>
            {libraryStatus?.variant === 'notInLibrary' && (
              <p className="mb-1.5 text-center text-[11px] font-medium text-muted-foreground">
                {libraryStatus.label}
              </p>
            )}
            {onAddClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddClick(song)
                }}
                disabled={addingId === song.id}
                aria-label={t('library.addToLibrary')}
                title={t('library.addToLibrary')}
                className="flex w-full items-center justify-center rounded-md bg-gray-200 px-3 py-1.5 text-xs transition-colors hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 sm:text-sm"
              >
                {addingId === song.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600 dark:border-gray-300" />
                ) : (
                  <PlusIcon className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface HorizontalSongSliderProps {
  title: string
  songs: Song[]
  onAddClick?: (song: Song) => void
  addingId?: string | null
  viewAllHref?: string
  viewAllLabel?: string
  getLibraryStatus?: (song: Song) => SongLibraryStatus | null
}

export default function HorizontalSongSlider({
  title,
  songs,
  onAddClick,
  addingId,
  viewAllHref,
  viewAllLabel,
  getLibraryStatus,
}: HorizontalSongSliderProps) {
  const { t, isRtl } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      const physicalDirection =
        direction === 'left'
          ? isRtl
            ? 1
            : -1
          : isRtl
            ? -1
            : 1
      scrollRef.current.scrollBy({
        left: physicalDirection * scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (songs.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h2>
          {viewAllHref && viewAllLabel && (
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-primary hover:text-primary/80 whitespace-nowrap shrink-0"
            >
              {viewAllLabel}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {songs.map((song) => (
          <HorizontalSongSlide
            key={song.id}
            song={song}
            libraryStatus={getLibraryStatus?.(song) ?? null}
            onAddClick={onAddClick}
            addingId={addingId}
          />
        ))}
      </div>

    </div>
  )
}
