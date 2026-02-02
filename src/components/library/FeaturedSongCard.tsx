'use client'

import { PlayIcon, PlusIcon } from '@heroicons/react/24/solid'
import { Song } from '@/types'
import Link from 'next/link'

interface FeaturedSongCardProps {
  song: Song
  onAddClick?: (song: Song) => void
  addingId?: string | null
}

export default function FeaturedSongCard({ song, onAddClick, addingId }: FeaturedSongCardProps) {
  const imageUrl = song.songImageUrl || song.artistImageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop'
  const description = song.versionDescription || song.genre || 'Découvrez cette chanson'

  return (
    <div className="mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-5">
        Sélectionné pour vous
      </h2>
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group">
        <img
          src={imageUrl}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          {/* Top section - Buttons right */}
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <Link
                href={`/song/${song.id}`}
                className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 group"
              >
                <PlayIcon className="h-6 w-6 text-white ml-1 group-hover:scale-110 transition-transform" />
              </Link>
              {onAddClick && (
                <button
                  onClick={() => onAddClick(song)}
                  disabled={addingId === song.id}
                  className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
                >
                  {addingId === song.id ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <PlusIcon className="h-6 w-6 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bottom section - Title left, Stats right */}
          <div className="flex items-end justify-between">
            {/* Title and Artist - Left */}
            <div className="flex-1 pr-4">
              <div className="text-white/90 text-xs sm:text-sm font-medium mb-1 uppercase tracking-wider">
                {song.author}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white line-clamp-2">
                {song.title}
              </h3>
            </div>
            
            {/* Stats - Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {song.rating && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-yellow-300">⭐</span>
                  <span className="font-semibold text-white text-sm">{song.rating.toFixed(1)}</span>
                </div>
              )}
              {song.viewCount && song.viewCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-blue-300">👁️</span>
                  <span className="font-medium text-white text-sm">{song.viewCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
