'use client'

import { Song } from '@/types'
import Link from 'next/link'
import { PlayIcon, PlusIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { useRef } from 'react'

interface HorizontalSongSliderProps {
  title: string
  songs: Song[]
  onAddClick?: (song: Song) => void
  addingId?: string | null
}

export default function HorizontalSongSlider({ title, songs, onAddClick, addingId }: HorizontalSongSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (songs.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <div className="flex gap-2">
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
        {songs.map((song) => {
          const imageUrl = song.songImageUrl || song.artistImageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'

          return (
            <div
              key={song.id}
              className="group flex-shrink-0 w-40 sm:w-48 relative"
            >
              <Link href={`/song/${song.id}`}>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-2 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                  <Image
                    src={imageUrl}
                    alt={song.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <PlayIcon className="h-6 w-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="px-1">
                <Link href={`/song/${song.id}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate mb-1 hover:underline">
                    {song.title}
                  </h3>
                </Link>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                  {song.author}
                </p>
                {onAddClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddClick(song)
                    }}
                    disabled={addingId === song.id}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                  >
                    {addingId === song.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300"></div>
                        <span>Ajout...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4" />
                        <span>Ajouter</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
