'use client'

import Link from 'next/link'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import type { Song } from '@/types'

interface SongGalleryProps {
  songs: Song[]
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
}

export default function SongGallery({ songs, showAddButton, onAddClick, addingId }: SongGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {songs.map((song) => (
        <div 
          key={song.id} 
          className="group bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg border border-gray-200 hover:border-gray-300 relative flex flex-col"
        >
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            {showAddButton && onAddClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddClick(song);
                }}
                disabled={addingId === song.id}
                className="p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed transform hover:scale-110 transition-all"
                title="Ajouter à ma bibliothèque"
              >
                {addingId === song.id ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <Link href={`/song/${song.id}`} className="flex-1 flex flex-col">
            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicalNoteIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                {song.title}
              </h3>
              <p className="text-xs text-gray-600 truncate mb-2">
                {song.author}
              </p>
              <div className="flex flex-wrap gap-1">
                {song.rating && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                    ⭐ {song.rating.toFixed(1)}
                  </span>
                )}
                {song.difficulty && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    🎸
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

