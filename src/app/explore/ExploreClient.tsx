'use client'

import { useState } from 'react'
import { Song } from '@/types'
import { MusicalNoteIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { useRouter } from 'next/navigation'

interface ExploreClientProps {
  initialSongs: Song[]
  userId?: string
}

export default function ExploreClient({ initialSongs, userId }: ExploreClientProps) {
  const [songs] = useState<Song[]>(initialSongs)
  const [cloningId, setCloningId] = useState<string | null>(null)
  const router = useRouter()

  const handleAddToLibrary = async (e: React.MouseEvent, song: Song) => {
    e.preventDefault() // Prevent navigation if clicking the button inside a Link
    e.stopPropagation()
    
    if (!userId) {
      // Redirect to login or show toast
      router.push('/login?next=/explore')
      return
    }

    try {
      setCloningId(song.id)
      await cloneSongAction(song.id)
      // Optional: Show success toast
      router.refresh() // Refresh to maybe update UI state if we tracked "added" status
    } catch (error) {
      console.error('Error cloning song:', error)
      // Optional: Show error toast
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tendances 📈
        </h1>
        <p className="text-sm text-gray-600">
          Découvrez les partitions les plus populaires du moment et ajoutez-les à votre collection.
        </p>
      </div>

      {/* Songs Grid */}
      {songs && songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {songs.map((song) => (
            <div 
              key={song.id} 
              className="group bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg border border-gray-200 hover:border-gray-300 relative flex flex-col"
            >
              <Link href={`/song/${song.id}`} className="flex-1">
                {/* Song Image */}
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
                  
                  {/* Overlay Add Button (Visible on hover or always on mobile?) */}
                  {userId && (
                    <button
                      onClick={(e) => handleAddToLibrary(e, song)}
                      disabled={cloningId === song.id}
                      className="absolute bottom-2 right-2 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed transform transition-transform active:scale-95"
                      title="Ajouter à ma bibliothèque"
                    >
                      {cloningId === song.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <PlusIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Song Info */}
                <div className="p-2 sm:p-3">
                  <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                    {song.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate mb-2">
                    {song.author}
                  </p>

                  {/* Metadata badges */}
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
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center">
              <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune tendance disponible
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Revenez plus tard, les tendances sont mises à jour régulièrement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

