'use client'

import { Song, Folder } from '@/types'
import FolderDropdown from '@/components/FolderDropdown'
import { MusicalNoteIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface SongTableRowProps {
  song: Song
  songs: Song[] // Full list of songs for navigation
  folders: Folder[]
  visibleColumns: string[]
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onFolderChange: (songId: string, folderId: string | undefined) => Promise<void>
  hasUser: boolean
  isSelectMode: boolean
  t: (key: string) => string
}

export default function SongTableRow({
  song,
  songs,
  folders,
  visibleColumns,
  isSelected,
  onSelect,
  onFolderChange,
  hasUser,
  isSelectMode,
  t
}: SongTableRowProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Make row draggable if user is authenticated
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
    <tr
      ref={setNodeRef}
      data-song-id={song.id}
      style={{
        ...style,
        touchAction: hasUser ? 'none' : 'auto',
      }}
      onClick={handleSongClick}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isDragging ? 'z-50 opacity-50' : ''}`}
    >
      {/* Checkbox column - Only show if user is logged in and select mode is active */}
      {hasUser && isSelectMode && (
        <td 
          className="px-2 sm:px-4 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            {/* Drag handle - only visible on mobile */}
            <div
              className="sm:hidden"
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
            >
              <Bars3Icon 
                className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              />
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onSelect(e.target.checked)
              }}
              className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
          </div>
        </td>
      )}
      
      {/* Title with image */}
      {visibleColumns.includes('title') && (
        <td className="px-2 sm:px-4 py-2">
          <div className="flex items-center">
            {song?.songImageUrl ? (
              <Image 
                src={song.songImageUrl} 
                alt={song.title}
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover mr-2 sm:mr-3 flex-shrink-0"
              />
            ) : (
              <MusicalNoteIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-none">
                {song.title}
              </div>
              {/* Mobile metadata */}
              <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="truncate max-w-[120px]">{song.author}</span>
                  {song.key && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">🎵 {song.key}</span>
                    </>
                  )}
                  {song.rating && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">⭐ {song.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      )}

      {/* Author */}
      {visibleColumns.includes('author') && (
        <td className="hidden sm:table-cell px-4 py-2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {song.artistImageUrl && (
              <Image 
                src={song.artistImageUrl} 
                alt={song.author}
                width={16}
                height={16}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              />
            )}
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{song.author}</span>
          </div>
        </td>
      )}

      {/* Key */}
      {visibleColumns.includes('key') && (
        <td className="hidden md:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.key ? (
              <span className="text-purple-600 dark:text-purple-400 font-medium">{song.key}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* Rating */}
      {visibleColumns.includes('rating') && (
        <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.rating ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">⭐ {song.rating.toFixed(1)}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* Reviews */}
      {visibleColumns.includes('reviews') && (
        <td className="hidden xl:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.reviews && song.reviews > 0 ? (
              <span className="text-gray-600 dark:text-gray-400 font-medium">👥 {song.reviews}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* Difficulty */}
      {visibleColumns.includes('difficulty') && (
        <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.difficulty ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">🎸 {song.difficulty}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* Version */}
      {visibleColumns.includes('version') && (
        <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.version ? (
              <span className="text-green-600 dark:text-green-400 font-medium">🔢 v{song.version}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* View Count */}
      {visibleColumns.includes('viewCount') && (
        <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {song.viewCount && song.viewCount > 0 ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">👁️ {song.viewCount}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}

      {/* Folder */}
      {visibleColumns.includes('folder') && (
        <td className="hidden md:table-cell px-4 py-2 whitespace-nowrap">
          <div onClick={(e) => e.stopPropagation()}>
            <FolderDropdown
              currentFolderId={song.folderId}
              folders={folders}
              onFolderChange={(newFolderId) => onFolderChange(song.id, newFolderId)}
              disabled={!hasUser}
            />
          </div>
        </td>
      )}

      {/* Updated At */}
      {visibleColumns.includes('updatedAt') && (
        <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {new Date(song.updatedAt).toLocaleDateString('fr-FR')}
        </td>
      )}
    </tr>
  )
}

