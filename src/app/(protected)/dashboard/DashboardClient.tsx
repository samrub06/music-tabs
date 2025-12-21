'use client'

import AddSongForm from '@/components/AddSongForm'
import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline'
import { useMemo, useState, useEffect } from 'react'
import { Song, Folder, Playlist } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from './actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'

interface DashboardClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  folders: Folder[]
  playlists?: Playlist[]
  userEmail?: string
}

export default function DashboardClient({ songs, total, page, limit, initialView = 'table', initialQuery = '', folders, playlists = [], userEmail }: DashboardClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [showAddSong, setShowAddSong] = useState(false)
  const qFromUrl = searchParams?.get('q') ?? initialQuery
  const [searchQuery, setSearchQuery] = useState(qFromUrl)
  const [localSearchValue, setLocalSearchValue] = useState(qFromUrl)

  // Sync localSearchValue with URL changes
  useEffect(() => {
    setLocalSearchValue(qFromUrl)
  }, [qFromUrl])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  
  // Drag and Drop state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Configure sensors for drag and drop (including touch for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts (prevents accidental drags)
      },
    })
  )
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    // Find the song being dragged
    const song = songs.find(s => s.id === active.id)
    setDraggedSong(song || null)
  }
  
  // Handle drag end (drop)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedSong(null)
    setError(null)
    
    if (!over) return
    
    const songId = active.id as string
    const dropTarget = over.id as string
    
    // Check if dropped on a folder (folder IDs start with 'folder-')
    if (typeof dropTarget === 'string' && dropTarget.startsWith('folder-')) {
      const folderId = dropTarget.replace('folder-', '') || undefined
      
      try {
        await updateSongFolderAction(songId, folderId)
        
        // Find folder name for success message
        const folderName = folderId 
          ? folders.find(f => f.id === folderId)?.name || 'le dossier'
          : 'Sans dossier'
        const songTitle = draggedSong?.title || 'la chanson'
        
        setSuccessMessage(`"${songTitle}" déplacée vers ${folderName}`)
      } catch (error) {
        console.error('Error moving song to folder:', error)
        setError('Erreur lors du déplacement de la chanson. Veuillez réessayer.')
      }
    }
  }

  const applyQuery = (next: { q?: string; view?: 'gallery' | 'table'; page?: number; limit?: number }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (next.q !== undefined) params.set('q', next.q)
    if (next.view) params.set('view', next.view)
    if (next.page) params.set('page', String(next.page))
    if (next.limit) params.set('limit', String(next.limit))
    else if (!params.has('limit')) params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Bienvenue, {userEmail || 'Utilisateur'}
            </p>
          </div>
          {/* Add Song Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowAddSong(true)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5 sm:mr-2" />
              <span className="sm:hidden">{t('navigation.addSongMobile')}</span>
              <span className="hidden sm:inline">{t('songs.addNew')}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Search Bar */}
            <div className="w-full sm:flex-1 sm:min-w-0 sm:max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('songs.search')}
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value
                      setSearchQuery(val)
                      applyQuery({ q: val, page: 1 })
                    }
                  }}
                  className="block w-full pl-10 sm:pl-10 pr-10 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
                {localSearchValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setLocalSearchValue('')
                      setSearchQuery('')
                      applyQuery({ q: '', page: 1 })
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
                    type="button"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Folder Filter */}
            <div className="w-full sm:w-auto inline-flex rounded-md shadow-sm border">
              <select
                value={selectedFolder || ''}
                onChange={(e) => {
                  const folderId = e.target.value || undefined
                  setSelectedFolder(folderId)
                  setCurrentFolder(folderId || null)
                }}
                className="block w-full py-2.5 sm:py-1.5 pl-3 sm:pl-3 pr-8 sm:pr-8 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Folders</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
              <div className="inline-flex rounded-md shadow-sm border">
                <select
                  value={limit}
                  onChange={(e) => applyQuery({ limit: Number(e.target.value), page: 1 })}
                  className="block w-full py-2.5 sm:py-1.5 pl-3 sm:pl-3 pr-8 sm:pr-8 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={10000}>All</option>
                </select>
              </div>

              <div className="inline-flex rounded-md shadow-sm border overflow-hidden">
                <button
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-sm flex items-center justify-center ${view === 'gallery' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => applyQuery({ view: 'gallery', page: 1 })}
                  title="Gallery View"
                >
                  <Squares2X2Icon className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
                <button
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-sm flex items-center justify-center border-l ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => applyQuery({ view: 'table', page: 1 })}
                  title="Table View"
                >
                  <TableCellsIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {songs && songs.length > 0 ? (
          view === 'table' ? (
            <>
              <SongTable
                songs={songs}
                folders={folders}
                playlists={playlists}
                currentFolder={currentFolder}
                currentPlaylistId={currentPlaylistId}
                searchQuery={searchQuery}
                hasUser={true}
                onFolderChange={updateSongFolderAction}
                onDeleteSongs={deleteSongsAction}
                onDeleteAllSongs={deleteAllSongsAction}
                onCurrentFolderChange={(folderId) => {
                  setCurrentFolder(folderId)
                  setSelectedFolder(folderId || undefined)
                }}
                onUpdateSong={updateSongAction}
              />
              <div className="hidden sm:block">
                <Pagination page={page} limit={limit} total={total} />
              </div>
              {/* Compact Pagination for Mobile - En bas */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit))
                const canPrev = page > 1
                const canNext = page < totalPages
                
                if (totalPages <= 1) return null
                
                return (
                  <div className="flex items-center justify-center gap-2 mt-4 sm:hidden">
                    <button
                      className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px]"
                      onClick={() => applyQuery({ page: page - 1 })}
                      disabled={!canPrev}
                    >
                      ‹
                    </button>
                    <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px]"
                      onClick={() => applyQuery({ page: page + 1 })}
                      disabled={!canNext}
                    >
                      ›
                    </button>
                  </div>
                )
              })()}
            </>
          ) : (
            <>
              <SongGallery songs={songs} hasUser={true} />
              <div className="hidden sm:block">
                <Pagination page={page} limit={limit} total={total} />
              </div>
              {/* Compact Pagination for Mobile - En bas */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit))
                const canPrev = page > 1
                const canNext = page < totalPages
                
                if (totalPages <= 1) return null
                
                return (
                  <div className="flex items-center justify-center gap-2 mt-4 sm:hidden">
                    <button
                      className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px]"
                      onClick={() => applyQuery({ page: page - 1 })}
                      disabled={!canPrev}
                    >
                      ‹
                    </button>
                    <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px]"
                      onClick={() => applyQuery({ page: page + 1 })}
                      disabled={!canNext}
                    >
                      ›
                    </button>
                  </div>
                )
              })()}
            </>
          )
        ) : null}
      </div>

      {/* Add song modal */}
      <AddSongForm 
        isOpen={showAddSong}
        onClose={() => setShowAddSong(false)}
        folders={folders}
      />
      
      {/* Drag overlay */}
      <DragOverlay>
        {draggedSong ? (
          <div className="opacity-90 bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3 max-w-[200px]">
            <div className="font-medium text-sm text-gray-900 truncate">{draggedSong.title}</div>
            <div className="text-xs text-gray-600 truncate">{draggedSong.author}</div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* Drag Drop Overlay - visible on mobile during drag */}
      <DragDropOverlay 
        folders={folders}
        isDragging={activeId !== null}
      />

      {/* Success Snackbar */}
      <Snackbar
        message={successMessage || ''}
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        type="success"
        duration={3000}
      />

      {/* Error Snackbar */}
      <Snackbar
        message={error || ''}
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        duration={5000}
      />
    </DndContext>
  )
}

