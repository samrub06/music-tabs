'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlayIcon, 
  MusicalNoteIcon, 
  ArrowLeftIcon,
  Bars3Icon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import { updatePlaylistOrderAction } from './actions'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PlaylistDetailClientProps {
  playlist: Playlist
  songs: Song[]
}

function SortableSongItem({ 
  song, 
  index,
  isDragging 
}: { 
  song: Song
  index: number
  isDragging: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: song.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const router = useRouter()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
        >
          <Bars3Icon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Index */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
          {index + 1}
        </div>

        {/* Song image */}
        <div className="flex-shrink-0">
          {song.songImageUrl ? (
            <img 
              src={song.songImageUrl} 
              alt={song.title}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <MusicalNoteIcon className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Song info */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => router.push(`/song/${song.id}`)}
        >
          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
            {song.title}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
            {song.author}
          </div>
          {song.key && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {song.key}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PlaylistDetailClient({ playlist, songs: initialSongs }: PlaylistDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [songs, setSongs] = useState(initialSongs)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const songIds = useMemo(() => songs.map(s => s.id), [songs])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsReordering(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      setIsReordering(false)
      return
    }

    const oldIndex = songIds.indexOf(active.id as string)
    const newIndex = songIds.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSongs = arrayMove(songs, oldIndex, newIndex)
      setSongs(newSongs)
      
      // Sauvegarder le nouvel ordre
      try {
        await updatePlaylistOrderAction(playlist.id, newSongs.map(s => s.id))
      } catch (error) {
        console.error('Error updating playlist order:', error)
        // Revert on error
        setSongs(songs)
      }
    }

    setActiveId(null)
    setIsReordering(false)
  }

  const handleStartPlaylist = () => {
    if (songs.length === 0) return

    // Save playlist context to sessionStorage
    if (typeof window !== 'undefined') {
      const songList = songs.map(s => s.id)
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: songs.map(s => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || ''
        }))
      }

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: `/playlist/${playlist.id}`,
        playlistContext
      }

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext')

      // Navigate to first song
      router.push(`/song/${songs[0].id}`)
    }
  }

  const activeSong = activeId ? songs.find(s => s.id === activeId) : null

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <button
            onClick={() => router.push('/playlists')}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label={t('common.back')}
          >
            <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {playlist.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <MusicalNoteIcon className="h-4 w-4" />
              <span>{songs.length} {songs.length === 1 ? t('playlistView.songs').slice(0, -1) : t('playlistView.songs')}</span>
            </div>
            {playlist.createdAt && (
              <div className="hidden sm:block">
                {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleStartPlaylist}
            disabled={songs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95"
          >
            <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{t('playlistView.startPlaylist')}</span>
          </button>
        </div>
      </div>

      {/* Songs List */}
      {songs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <MusicalNoteIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('playlistView.noSongsInPlaylist')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('playlistView.addSongsToPlaylist')}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 sm:space-y-3">
              {songs.map((song, index) => (
                <SortableSongItem
                  key={song.id}
                  song={song}
                  index={index}
                  isDragging={activeId === song.id}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSong ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-500 shadow-lg p-4 opacity-95">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <MusicalNoteIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {activeSong.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {activeSong.author}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
