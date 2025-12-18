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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
      {songs.map((song) => (
        <div 
          key={song.id} 
          className="group bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg border border-gray-200 hover:border-gray-300 relative flex flex-col"
        >
          <Link href={`/song/${song.id}`} className="flex-1">
            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicalNoteIcon className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-1.5 sm:p-2">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate mb-1 group-hover:text-blue-600 transition-colors">
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
              </div>
            </div>
          </Link>
          {showAddButton && onAddClick && (
            <button
              onClick={() => onAddClick(song)}
              disabled={addingId === song.id}
              className="m-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              title="Ajouter à ma bibliothèque"
            >
              {addingId === song.id ? 'Ajout...' : 'Ajouter'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

