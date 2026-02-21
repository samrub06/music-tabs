'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon, MusicalNoteIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline'

const RECENT_SONGS_SEARCHES_KEY = 'recentSongsSearches'
const MAX_RECENT_SEARCHES = 10
import { useMemo, useState, useEffect, useRef } from 'react'
import { Song, Folder, Playlist } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from '../dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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
  initialTab?: 'all' | 'recent' | 'popular'
  folders: Folder[]
  playlists?: Playlist[]
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
}

export default function SongsClient({ songs, total, page, limit, initialView = 'table', initialQuery = '', initialTab = 'all', folders, playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc' }: SongsClientProps) {
  const { t } = useLanguage()
  
  const sortFieldLabels: Record<SortField, string> = {
    title: t('songs.title'),
    author: t('songs.artist'),
    key: t('songs.key'),
    rating: t('songs.rating'),
    reviews: t('songs.reviews'),
    difficulty: t('songs.difficulty'),
    version: t('songs.version'),
    viewCount: t('songs.viewCount'),
    updatedAt: t('songs.modified'),
    createdAt: t('songs.createdAt')
  }
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [localSearchValue, setLocalSearchValue] = useState(initialQuery)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isInputFocused, setIsInputFocused] = useState(false)
  
  // Filter state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(initialFolder)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortOrder)
  
  // Other state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(selectedFolder || null)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>(initialTab)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SONGS_SEARCHES_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setRecentSearches(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          console.error('Error parsing recent songs searches:', e)
        }
      }
    }
  }, [])

  // Sync state from initialQuery when parent passes new value (e.g. after URL update)
  useEffect(() => {
    setLocalSearchValue(initialQuery)
    setSearchQuery(initialQuery)
  }, [initialQuery])

  // Debounced search - update searchQuery, save to recent, and sync URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearchValue.trim()
      setSearchQuery(trimmed)
      if (trimmed) {
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
          const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
          if (typeof window !== 'undefined') {
            localStorage.setItem(RECENT_SONGS_SEARCHES_KEY, JSON.stringify(updated))
          }
          return updated
        })
      }
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (trimmed) {
        params.set('searchQuery', trimmed)
        params.set('page', '1')
      } else {
        params.delete('searchQuery')
        params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchValue, pathname, router, searchParams])

  // Handle songId from URL - navigate to song page if present
  useEffect(() => {
    const songIdFromUrl = searchParams?.get('songId')
    if (songIdFromUrl) {
      router.push(`/song/${songIdFromUrl}`)
    }
  }, [searchParams, router])

  // Sync folder, sortOrder, and tab from URL
  useEffect(() => {
    const folderFromUrl = searchParams?.get('folder')
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    const tabFromUrl = searchParams?.get('tab')
    if (folderFromUrl !== null) {
      setSelectedFolder(folderFromUrl || undefined)
      setCurrentFolder(folderFromUrl || null)
    }
    if (sortOrderFromUrl === 'desc' || sortOrderFromUrl === 'asc') {
      setSortDirection(sortOrderFromUrl)
    }
    if (tabFromUrl === 'recent' || tabFromUrl === 'popular') {
      setActiveTab(tabFromUrl)
    } else {
      setActiveTab('all')
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
          ? folders.find(f => f.id === folderId)?.name || t('songs.theFolder')
          : t('songs.unorganized')
        const songTitle = draggedSong?.title || t('songs.theSong')
        
        setSuccessMessage(`"${songTitle}" ${t('songs.songMoved')} ${folderName}`)
      } catch (error) {
        console.error('Error moving song to folder:', error)
        setError(t('songs.moveError'))
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

  // Sort and filter by search query and tab
  const sortedSongs = useMemo(() => {
    let sorted = [...filteredSongs]

    // Apply tab-based filtering
    if (activeTab === 'recent') {
      // Sort by updatedAt descending (most recently viewed/updated first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
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
      // All tab: Default sort by title
      sorted.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase()
        const titleB = (b.title || '').toLowerCase()
        return titleA.localeCompare(titleB)
      })
    }

    // Filter by search query (applies to all tabs)
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
  }, [filteredSongs, searchQuery, activeTab])

  const applyQuery = (next: { view?: 'gallery' | 'table'; page?: number; limit?: number; songId?: string; folder?: string; sortOrder?: 'asc' | 'desc'; searchQuery?: string; tab?: 'all' | 'recent' | 'popular' }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('q')
    if (next.searchQuery !== undefined) {
      if (next.searchQuery) params.set('searchQuery', next.searchQuery)
      else params.delete('searchQuery')
    }
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
    if (next.tab !== undefined) {
      if (next.tab !== 'all') params.set('tab', next.tab)
      else params.delete('tab')
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

  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
    applyQuery({ searchQuery: '', page: 1 })
  }

  const handleRecentSearchClick = (query: string) => {
    setLocalSearchValue(query)
    setSearchQuery(query)
    applyQuery({ searchQuery: query, page: 1 })
    searchInputRef.current?.blur()
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
        {/* Search bar - full width, same style as Search page */}
        <div className="mb-6 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={t('songs.search')}
              className="block w-full pl-12 pr-12 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 dark:text-gray-100"
            />
            {localSearchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] justify-center"
                aria-label={t('common.clear')}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {/* Recent searches dropdown */}
          {isInputFocused && !localSearchValue.trim() && recentSearches.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                  {t('songs.recentSearches')}
                </div>
                {recentSearches.map((query, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleRecentSearchClick(query)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors min-h-[44px]"
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Secondary row: Filter + View toggle - touch-friendly */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="p-3 min-h-[44px] min-w-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            aria-label={t('songs.filters')}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1 rounded-full bg-muted/80 dark:bg-gray-800 p-0.5">
            <button
              type="button"
              className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'gallery'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => applyQuery({ view: 'gallery', page: 1 })}
              title={t('songs.galleryView')}
            >
              <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t('songs.galleryView')}</span>
            </button>
            <button
              type="button"
              className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'table'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => applyQuery({ view: 'table', page: 1 })}
              title={t('songs.tableView')}
            >
              <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t('songs.tableView')}</span>
            </button>
          </div>
        </div>

        {/* Filtering Tabs - segmented control style, touch-friendly */}
        <div className="mb-4 lg:hidden">
          <div className="flex rounded-full bg-muted/80 dark:bg-gray-800 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => applyQuery({ tab: 'all', page: 1 })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-full min-h-[44px] transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
              <span>{t('songs.all')}</span>
            </button>
            <button
              type="button"
              onClick={() => applyQuery({ tab: 'recent', page: 1 })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-full min-h-[44px] transition-all duration-200 ${
                activeTab === 'recent'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              <span>{t('songs.recent')}</span>
            </button>
            <button
              type="button"
              onClick={() => applyQuery({ tab: 'popular', page: 1 })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-full min-h-[44px] transition-all duration-200 ${
                activeTab === 'popular'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FireIcon className="h-4 w-4 flex-shrink-0" />
              <span>{t('songs.popular')}</span>
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
                <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
              </div>
              {/* Compact Pagination for Mobile */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit))
                const canPrev = page > 1
                const canNext = page < totalPages
                
                if (totalPages <= 1 && total <= limit) return null
                
                return (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:hidden">
                    {totalPages > 1 && (
                      <>
                        <button
                          className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px] min-h-[44px]"
                          onClick={() => applyQuery({ page: page - 1 })}
                          disabled={!canPrev}
                        >
                          ‹
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">
                          {page} / {totalPages}
                        </span>
                        <button
                          className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px] min-h-[44px]"
                          onClick={() => applyQuery({ page: page + 1 })}
                          disabled={!canNext}
                        >
                          ›
                        </button>
                      </>
                    )}
                    {total > limit && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded border text-sm font-medium min-h-[44px] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => applyQuery({ limit: 10000, page: 1 })}
                      >
                        {t('common.showAll')}
                      </button>
                    )}
                  </div>
                )
              })()}
            </>
          ) : (
            <>
              <SongGallery songs={sortedSongs} hasUser={true} />
              <div className="hidden sm:block mt-4">
                <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
              </div>
              {/* Compact Pagination for Mobile */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit))
                const canPrev = page > 1
                const canNext = page < totalPages
                
                if (totalPages <= 1 && total <= limit) return null
                
                return (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:hidden">
                    {totalPages > 1 && (
                      <>
                        <button
                          className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px] min-h-[44px]"
                          onClick={() => applyQuery({ page: page - 1 })}
                          disabled={!canPrev}
                        >
                          ‹
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">
                          {page} / {totalPages}
                        </span>
                        <button
                          className="px-3 py-2 rounded border text-sm font-medium disabled:opacity-50 min-w-[40px] min-h-[44px]"
                          onClick={() => applyQuery({ page: page + 1 })}
                          disabled={!canNext}
                        >
                          ›
                        </button>
                      </>
                    )}
                    {total > limit && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded border text-sm font-medium min-h-[44px] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => applyQuery({ limit: 10000, page: 1 })}
                      >
                        {t('common.showAll')}
                      </button>
                    )}
                  </div>
                )
              })()}
            </>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery.trim() ? t('songs.noResults') : t('songs.noSongs')}
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

      {/* Advanced Filter Sheet - ui-design-toolsbar style */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] max-h-[640px] rounded-t-[1.75rem] border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
        >
          {/* Drag handle */}
          <div className="py-3.5 cursor-ns-resize touch-none flex justify-center -mt-1">
            <div className="w-14 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <SheetHeader className="px-1 pb-2">
            <SheetTitle className="text-xl font-semibold">{t('songs.advancedFilters')}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto pb-24 px-1">
            {/* Folder Selection - card style */}
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="folder" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.folder')}
              </Label>
              <Select
                value={selectedFolder || 'all'}
                onValueChange={(value) => setSelectedFolder(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="folder" className="h-10 rounded-xl">
                  <SelectValue placeholder={t('songs.allFolders')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('songs.allFolders')}</SelectItem>
                  <SelectItem value="unorganized">{t('songs.unorganized')}</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Field - card style */}
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="sortField" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortBy')}
              </Label>
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger id="sortField" className="h-10 rounded-xl">
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

            {/* Sort Direction - card style */}
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="sortDirection" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortOrder')}
              </Label>
              <Select
                value={sortDirection}
                onValueChange={(value) => setSortDirection(value as SortDirection)}
              >
                <SelectTrigger id="sortDirection" className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('songs.ascending')}</SelectItem>
                  <SelectItem value="desc">{t('songs.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex flex-row gap-3 px-6 py-4 pt-4 pb-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-background safe-area-inset-bottom">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
            >
              {t('common.clear')}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
            >
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </DndContext>
  )
}
