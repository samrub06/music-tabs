'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { MusicalNoteIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import type { Song } from '@/types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface SongGalleryProps {
  songs: Song[]
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
  hasUser?: boolean
}

// Draggable song card component
function DraggableSongCard({ 
  song, 
  songs, 
  pathname, 
  router, 
  showAddButton, 
  onAddClick, 
  addingId,
  hasUser 
}: { 
  song: Song
  songs: Song[]
  pathname: string | null
  router: any
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
  hasUser?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: song.id,
    disabled: !hasUser,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSongClick = () => {
    // Don't navigate if dragging
    if (isDragging) return
    
    // Save song list to sessionStorage for navigation
    if (typeof window !== 'undefined') {
      const songList = songs.map(s => s.id)
      const currentIndex = songs.findIndex(s => s.id === song.id)
      const navigationData = {
        songList,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
        sourceUrl: pathname || window.location.pathname
      }
      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext') // Reset hasUsedNext when navigating to a new song
    }
    
    // Navigate to song page
    router.push(`/song/${song.id}`)
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg border-2 relative flex flex-col ${
        isDragging 
          ? 'z-50 shadow-xl border-blue-500 opacity-75' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Drag handle - positioned in bottom-right corner */}
      {hasUser && (
        <div
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-md shadow-md cursor-grab active:cursor-grabbing hover:bg-white transition-colors touch-none"
          style={{ touchAction: 'none' }}
          aria-label="Drag to move song"
        >
          <ArrowsUpDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
        </div>
      )}
      <div onClick={handleSongClick} className="flex-1 cursor-pointer">
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
          </div>
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
    )
}

export default function SongGallery({ songs, showAddButton, onAddClick, addingId, hasUser = false }: SongGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
      {songs.map((song) => (
        <DraggableSongCard
          key={song.id}
          song={song}
          songs={songs}
          pathname={pathname}
          router={router}
          showAddButton={showAddButton}
          onAddClick={onAddClick}
          addingId={addingId}
          hasUser={hasUser}
        />
      ))}
    </div>
  )
}

