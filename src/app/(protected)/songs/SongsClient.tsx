'use client'

import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Song, Folder, Playlist } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from '../dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortField, SortDirection } from '@/components/SortSelectionModal'

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

const sortFieldLabels: Record<SortField, string> = {
  title: 'Titre',
  author: 'Artiste',
  key: 'Tonalité',
  rating: 'Note',
  reviews: 'Avis',
  difficulty: 'Difficulté',
  version: 'Version',
  viewCount: 'Vues',
  updatedAt: 'Modifié',
  createdAt: 'Date'
}

export default function SongsClient({ songs, total, page, limit, initialView = 'table', initialQuery = '', folders, playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc' }: SongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [localSearchValue, setLocalSearchValue] = useState(initialQuery)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  
  // Filter state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(initialFolder)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortOrder)
  
  // Other state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(selectedFolder || null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      router.push(`/song/${songIdFromUrl}`)
    }
  }, [searchParams?.get('songId'), router])

  // Sync folder and sortOrder from URL
  useEffect(() => {
    const folderFromUrl = searchParams?.get('folder')
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    if (folderFromUrl !== null) {
      setSelectedFolder(folderFromUrl || undefined)
      setCurrentFolder(folderFromUrl || null)
    }
    if (sortOrderFromUrl === 'desc' || sortOrderFromUrl === 'asc') {
      setSortDirection(sortOrderFromUrl)
    }
  }, [searchParams])

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const song = songs.find(s => s.id === active.id)
    setDraggedSong(song || null)
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedSong(null)
    setError(null)
    
    if (!over) return
    
    const songId = active.id as string
    const dropTarget = over.id as string
    
    if (typeof dropTarget === 'string' && dropTarget.startsWith('folder-')) {
      const folderId = dropTarget.replace('folder-', '') || undefined
      
      try {
        await updateSongFolderAction(songId, folderId)
        
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

  // Filter songs by folder
  const filteredSongs = useMemo(() => {
    let filtered = [...songs]

    if (currentFolder === 'unorganized') {
      filtered = filtered.filter(song => !song.folderId)
    } else if (currentFolder) {
      filtered = filtered.filter(song => song.folderId === currentFolder)
    }

    return filtered
  }, [songs, currentFolder])

  // Sort and filter by search query
  const sortedSongs = useMemo(() => {
    let sorted = [...filteredSongs]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      sorted = sorted.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query) ||
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
  }, [filteredSongs, searchQuery])

  const applyQuery = (next: { page?: number; limit?: number; songId?: string; folder?: string; sortOrder?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('q')
    params.delete('searchQuery')
    params.set('view', 'table') // Always table view
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

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
    applyQuery({ sortOrder: direction, page: 1 })
  }

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev)
  }

  // Handle search expansion (mobile)
  const handleSearchIconClick = () => {
    setIsSearchExpanded(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  // Handle search clear
  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
    setIsSearchExpanded(false)
  }

  // Handle filter apply
  const handleApplyFilters = () => {
    handleFolderChange(selectedFolder)
    handleSortChange(sortField, sortDirection)
    setIsFilterSheetOpen(false)
  }

  // Handle filter clear
  const handleClearFilters = () => {
    setSelectedFolder(undefined)
    setSortField('title')
    setSortDirection('asc')
    handleFolderChange(undefined)
    handleSortChange('title', 'asc')
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Header with Search and Filter Icons */}
        <div className="mb-4 flex items-center justify-between gap-2">
          {/* Mobile: Search Icon / Desktop: Search Bar */}
          <div className="flex-1 flex items-center gap-2">
            {/* Mobile: Search Icon Button */}
            {!isSearchExpanded && (
              <button
                onClick={handleSearchIconClick}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            )}

            {/* Mobile: Expanded Search / Desktop: Always Visible Search */}
            <div className={`${isSearchExpanded ? 'flex-1' : 'hidden lg:flex flex-1'} relative`}>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('songs.search')}
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  onBlur={() => {
                    // On mobile, collapse search if empty
                    if (!localSearchValue.trim() && window.innerWidth < 1024) {
                      setIsSearchExpanded(false)
                    }
                  }}
                  className="pl-9 pr-9"
                />
                {localSearchValue && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    type="button"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Icon Button */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Filters"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Table Only */}
        {sortedSongs && sortedSongs.length > 0 ? (
          <>
            <SongTable
              songs={sortedSongs}
              folders={folders}
              playlists={playlists}
              currentFolder={currentFolder}
              currentPlaylistId={null}
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
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              isSelectMode={isSelectMode}
              onToggleSelectMode={toggleSelectMode}
            />
            <div className="hidden sm:block mt-4">
              <Pagination page={page} limit={limit} total={total} />
            </div>
            {/* Compact Pagination for Mobile */}
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
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery.trim() ? 'Aucun résultat trouvé' : 'Aucune chanson'}
            </p>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedSong ? (
          <div className="opacity-90 bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3 max-w-[200px]">
            <div className="font-medium text-sm text-gray-900 truncate">{draggedSong.title}</div>
            <div className="text-xs text-gray-600 truncate">{draggedSong.author}</div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* Drag Drop Overlay */}
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

      {/* Advanced Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] max-h-[600px]">
          <SheetHeader>
            <SheetTitle>Filtres avancés</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6 overflow-y-auto pb-20">
            {/* Folder Selection */}
            <div className="space-y-2">
              <Label htmlFor="folder">Dossier</Label>
              <Select
                value={selectedFolder || 'all'}
                onValueChange={(value) => setSelectedFolder(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Tous les dossiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les dossiers</SelectItem>
                  <SelectItem value="unorganized">Sans dossier</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Field */}
            <div className="space-y-2">
              <Label htmlFor="sortField">Trier par</Label>
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger id="sortField">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortFieldLabels).map(([field, label]) => (
                    <SelectItem key={field} value={field}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div className="space-y-2">
              <Label htmlFor="sortDirection">Ordre</Label>
              <Select
                value={sortDirection}
                onValueChange={(value) => setSortDirection(value as SortDirection)}
              >
                <SelectTrigger id="sortDirection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Croissant</SelectItem>
                  <SelectItem value="desc">Décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={handleClearFilters}>
              Effacer
            </Button>
            <Button onClick={handleApplyFilters}>
              Appliquer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}
