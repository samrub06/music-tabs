'use client'

import AddSongForm from '@/components/AddSongForm'
import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import FolderSelectionModal from '@/components/FolderSelectionModal'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, Squares2X2Icon, TableCellsIcon, MusicalNoteIcon, ClockIcon, FireIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useMemo, useState, useEffect } from 'react'
import { Song, Folder, Playlist } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from '../dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'

interface SongsClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  folders: Folder[]
  playlists?: Playlist[]
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
}

export default function SongsClient({ songs, total, page, limit, initialView = 'table', initialQuery = '', folders, playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc' }: SongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [showAddSong, setShowAddSong] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [localSearchValue, setLocalSearchValue] = useState(initialQuery)
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(initialFolder)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)

  // Debounced search - update searchQuery after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchValue])

  // Handle songId from URL - navigate to song page if present
  useEffect(() => {
    const songIdFromUrl = searchParams?.get('songId')
    if (songIdFromUrl) {
      // Navigate to song page and remove songId from URL
      router.push(`/song/${songIdFromUrl}`)
    }
  }, [searchParams?.get('songId'), router])

  const [currentFolder, setCurrentFolder] = useState<string | null>(selectedFolder || null)

  // Sync folder and sortOrder from URL
  useEffect(() => {
    const folderFromUrl = searchParams?.get('folder')
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    if (folderFromUrl !== null) {
      setSelectedFolder(folderFromUrl || undefined)
      setCurrentFolder(folderFromUrl || null)
    }
    if (sortOrderFromUrl === 'desc' || sortOrderFromUrl === 'asc') {
      setSortOrder(sortOrderFromUrl)
    }
  }, [searchParams])
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>('all')
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

  // Filter songs by folder first
  const filteredSongs = useMemo(() => {
    let filtered = [...songs]

    // Filter by folder (same logic as SongTable)
    if (currentFolder === 'unorganized') {
      filtered = filtered.filter(song => !song.folderId)
    } else if (currentFolder) {
      filtered = filtered.filter(song => song.folderId === currentFolder)
    }
    // If currentFolder is null, show all songs

    return filtered
  }, [songs, currentFolder])

  // Sort filtered songs by folder and filter by search query and tab filter
  const sortedSongs = useMemo(() => {
    let sorted = [...filteredSongs]

    // Apply tab-based filtering
    if (activeTab === 'recent') {
      // Sort by createdAt descending (most recent first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })
    } else if (activeTab === 'popular') {
      // Filter songs with viewCount > 0 and sort by viewCount descending
      sorted = sorted.filter(song => song.viewCount && song.viewCount > 0)
      sorted.sort((a, b) => {
        const viewCountA = a.viewCount || 0
        const viewCountB = b.viewCount || 0
        return viewCountB - viewCountA
      })
    } else {
      // All tab: Sort by folder displayOrder, then by folder name
      sorted.sort((a, b) => {
        const folderA = folders.find(f => f.id === a.folderId)
        const folderB = folders.find(f => f.id === b.folderId)
        
        // Get displayOrder (use Infinity if no folder or no displayOrder)
        const orderA = folderA?.displayOrder ?? Infinity
        const orderB = folderB?.displayOrder ?? Infinity
        
        // If both have displayOrder, sort by it
        if (orderA !== Infinity && orderB !== Infinity) {
          if (sortOrder === 'asc') {
            return orderA - orderB
          } else {
            return orderB - orderA
          }
        }
        
        // Fallback to folder name comparison
        const nameA = folderA?.name || ''
        const nameB = folderB?.name || ''
        
        if (sortOrder === 'asc') {
          return nameA.localeCompare(nameB)
        } else {
          return nameB.localeCompare(nameA)
        }
      })
    }

    // Filter by search query (applies to all tabs)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      sorted = sorted.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query) ||
        // Search in all sections and lines for structured songs
        song.sections?.some(section => 
          section.name.toLowerCase().includes(query) ||
          section.lines.some(line => 
            line.lyrics?.toLowerCase().includes(query) ||
            line.chords?.some(chord => chord.chord.toLowerCase().includes(query))
          )
        )
      )
    }

    return sorted
  }, [filteredSongs, folders, sortOrder, searchQuery, activeTab])

  const applyQuery = (next: { view?: 'gallery' | 'table'; page?: number; limit?: number; songId?: string; folder?: string; sortOrder?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    // Remove old 'q' and 'searchQuery' params if they exist (cleanup old URLs)
    params.delete('q')
    params.delete('searchQuery')
    if (next.view) params.set('view', next.view)
    if (next.page) params.set('page', String(next.page))
    if (next.limit) params.set('limit', String(next.limit))
    else if (!params.has('limit')) params.set('limit', String(limit))
    if (next.songId !== undefined) {
      if (next.songId) params.set('songId', next.songId)
      else params.delete('songId')
    }
    if (next.folder !== undefined) {
      if (next.folder) params.set('folder', next.folder)
      else params.delete('folder')
    }
    if (next.sortOrder !== undefined) {
      if (next.sortOrder) params.set('sortOrder', next.sortOrder)
      else params.delete('sortOrder')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleFolderChange = (folderId: string | undefined) => {
    setSelectedFolder(folderId)
    setCurrentFolder(folderId || null)
    applyQuery({ folder: folderId, page: 1 })
  }

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order)
    applyQuery({ sortOrder: order, page: 1 })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Top Row: Add Song Button + View Toggle */}
        <div className="mb-4 flex items-center justify-between gap-2">
          {/* Add Song Button */}
          <button
            onClick={() => setShowAddSong(true)}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5 sm:mr-2" />
            <span className="sm:hidden">{t('navigation.addSongMobile')}</span>
            <span className="hidden sm:inline">{t('songs.addNew')}</span>
          </button>

          {/* View toggle */}
          <div className="inline-flex rounded-md shadow-sm border overflow-hidden">
            <button
              className={`px-3 sm:px-3 py-2 sm:py-2 text-sm flex items-center justify-center ${view === 'gallery' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => applyQuery({ view: 'gallery', page: 1 })}
              title="Gallery View"
            >
              <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              className={`px-3 sm:px-3 py-2 sm:py-2 text-sm flex items-center justify-center border-l ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => applyQuery({ view: 'table', page: 1 })}
              title="Table View"
            >
              <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Full width */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('songs.search')}
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {localSearchValue && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLocalSearchValue('')
                  setSearchQuery('')
                }}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
                type="button"
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Folder Filter Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowFolderModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <span>
              {selectedFolder
                ? folders.find((f) => f.id === selectedFolder)?.name || 'All Folders'
                : 'All Folders'}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Filtering Tabs - Mobile optimized */}
        <div className="mb-4 lg:hidden">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MusicalNoteIcon className="h-4 w-4 mr-2" />
              <span>All</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FireIcon className="h-4 w-4 mr-2" />
              <span>Popular</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {sortedSongs && sortedSongs.length > 0 ? (
          view === 'table' ? (
            <>
              <SongTable
                songs={sortedSongs}
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
                  handleFolderChange(folderId || undefined)
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
              <SongGallery songs={sortedSongs} hasUser={true} />
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

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        folders={folders}
        selectedFolderId={selectedFolder}
        onSelectFolder={handleFolderChange}
      />
    </DndContext>
  )
}

