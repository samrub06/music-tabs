'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon, MusicalNoteIcon, ClockIcon, FireIcon, PlusIcon } from '@heroicons/react/24/outline'
import { SelectModeToggleButton } from '@/components/song-table/SongTableHeader'

const RECENT_SONGS_SEARCHES_KEY = 'recentSongsSearches'
const MAX_RECENT_SEARCHES = 10

const toolbarSegmentContainer =
  'flex items-center gap-0.5 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800'

function toolbarSegmentButton(active: boolean, className?: string) {
  return cn(
    'flex h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium transition-all duration-200 sm:gap-2 sm:px-4',
    active
      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
      : 'text-muted-foreground hover:text-foreground',
    className
  )
}
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Song, Playlist } from '@/types'
import { useFoldersContext } from '@/context/FoldersContext'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from '../dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAddSongModal } from '@/context/AddSongModalContext'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortField, SortDirection } from '@/components/SortSelectionModal'

export type CapoFilter = 'any' | 'with' | 'without'

interface SongsClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  initialTab?: 'all' | 'recent' | 'popular'
  playlists?: Playlist[]
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
  initialEasyChord?: boolean
  initialCapoFilter?: CapoFilter
  likedOnly?: boolean
}

export default function SongsClient({ songs, total, page, limit, initialView = 'table', initialQuery = '', initialTab = 'all', playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc', initialEasyChord = false, initialCapoFilter = 'any', likedOnly = false }: SongsClientProps) {
  const { t } = useLanguage()
  const { folders } = useFoldersContext()
  
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
  const { openAddSongModal, navigateToAddSongPage } = useAddSongModal()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)
  
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
  const [filterEasyChord, setFilterEasyChord] = useState<boolean>(initialEasyChord)
  const [filterCapo, setFilterCapo] = useState<CapoFilter>(initialCapoFilter)
  
  // Other state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(selectedFolder || null)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>(initialTab)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const searchParamsKey = searchParams?.toString() ?? ''
  const prefetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const prefetchPage = (nextPage: number) => {
      const params = new URLSearchParams(searchParamsKey)
      params.set('page', String(nextPage))
      params.set('limit', String(limit))
      const href = `${pathname}?${params.toString()}`
      const prefetchKey = `${href}|${nextPage}`

      if (prefetchedRef.current.has(prefetchKey)) return
      prefetchedRef.current.add(prefetchKey)
      router.prefetch(href)
    }

    if (page > 1) prefetchPage(page - 1)
    if (page < totalPages) prefetchPage(page + 1)
  }, [page, limit, totalPages, pathname, searchParamsKey, router])

  const openAddSongPageForArtist = (query: string) => {
    const folderId = selectedFolder || searchParams?.get('folder') || undefined
    navigateToAddSongPage({
      query,
      autoSearch: true,
      folderId,
    })
  }

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

  // Sync folder, sortOrder, tab, easyChord, capo from URL
  useEffect(() => {
    const folderFromUrl = searchParams?.get('folder')
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    const tabFromUrl = searchParams?.get('tab')
    const easyChordFromUrl = searchParams?.get('easyChord')
    const capoFromUrl = searchParams?.get('capo')
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
    if (easyChordFromUrl === '1' || easyChordFromUrl === 'true') {
      setFilterEasyChord(true)
    } else {
      setFilterEasyChord(false)
    }
    if (capoFromUrl === 'with' || capoFromUrl === 'without') {
      setFilterCapo(capoFromUrl)
    } else {
      setFilterCapo('any')
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

  const applyQuery = (next: { view?: 'gallery' | 'table'; page?: number; limit?: number; songId?: string; folder?: string; sortOrder?: 'asc' | 'desc'; searchQuery?: string; tab?: 'all' | 'recent' | 'popular'; easyChord?: boolean; capo?: CapoFilter }) => {
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
    if (next.easyChord !== undefined) {
      if (next.easyChord) params.set('easyChord', '1')
      else params.delete('easyChord')
    }
    if (next.capo !== undefined) {
      if (next.capo !== 'any') params.set('capo', next.capo)
      else params.delete('capo')
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
    setIsSelectMode((prev) => !prev)
  }

  useEffect(() => {
    if (view !== 'table') {
      setIsSelectMode(false)
    }
  }, [view])

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
    setCurrentFolder(selectedFolder || null)
    setSortField(sortField)
    setSortDirection(sortDirection)
    applyQuery({
      folder: selectedFolder,
      sortOrder: sortDirection,
      easyChord: filterEasyChord,
      capo: filterCapo,
      page: 1,
    })
    setIsFilterSheetOpen(false)
  }

  // Handle filter clear
  const handleClearFilters = () => {
    setSelectedFolder(undefined)
    setCurrentFolder(null)
    setSortField('title')
    setSortDirection('asc')
    setFilterEasyChord(false)
    setFilterCapo('any')
    applyQuery({ folder: undefined, sortOrder: 'asc', easyChord: false, capo: 'any', page: 1 })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden p-3 sm:p-6">
        <div
          className={cn(
            'relative shrink-0 space-y-4 pb-4',
            isInputFocused && 'z-30'
          )}
        >
        {likedOnly && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('library.likedSongs')}
          </h1>
        )}
        <div className="flex items-stretch gap-2 max-lg:transition-[gap] max-lg:duration-200">
          <div
            className={cn(
              'min-w-0 relative transition-[flex] duration-200',
              isInputFocused ? 'flex-1 max-lg:flex-[1_1_100%]' : 'flex-1'
            )}
          >
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
                onBlur={() => {
                  window.setTimeout(() => setIsInputFocused(false), 150)
                }}
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
              <div
                className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
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
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={cn(
              'shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:opacity-0 max-lg:p-0'
            )}
            aria-label={t('songs.filters')}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 max-lg:shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => openAddSongModal()}
            className="shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center"
            aria-label={t('navigation.addSong')}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Filtering Tabs + View toggle - same row, touch-friendly */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 lg:hidden">
            <div className={cn(toolbarSegmentContainer, 'w-full')}>
              <button
                type="button"
                onClick={() => applyQuery({ tab: 'all', page: 1 })}
                className={toolbarSegmentButton(activeTab === 'all', 'flex-1')}
              >
                <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('songs.all')}</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuery({ tab: 'recent', page: 1 })}
                className={toolbarSegmentButton(activeTab === 'recent', 'flex-1')}
              >
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('songs.recent')}</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuery({ tab: 'popular', page: 1 })}
                className={toolbarSegmentButton(activeTab === 'popular', 'flex-1')}
              >
                <FireIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('songs.popular')}</span>
              </button>
            </div>
          </div>
          <div className={cn(toolbarSegmentContainer, 'shrink-0 lg:ml-auto')}>
            {(view === 'table' || isSelectMode) && (
              <SelectModeToggleButton
                isSelectMode={isSelectMode}
                onToggle={toggleSelectMode}
                t={t}
              />
            )}
            <button
              type="button"
              className={toolbarSegmentButton(view === 'gallery')}
              onClick={() => applyQuery({ view: 'gallery', page: 1 })}
              title={t('songs.galleryView')}
            >
              <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('songs.galleryView')}</span>
            </button>
            <button
              type="button"
              className={toolbarSegmentButton(view === 'table')}
              onClick={() => applyQuery({ view: 'table', page: 1 })}
              title={t('songs.tableView')}
            >
              <TableCellsIcon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('songs.tableView')}</span>
            </button>
          </div>
        </div>
        </div>

        <div
          ref={scrollContainerRef}
          data-main-scroll
          className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
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
                totalMatchingCount={total}
                selectionFilters={{
                  q: searchQuery.trim() || undefined,
                  tab: activeTab,
                  easyChord: filterEasyChord || undefined,
                  capoFilter: filterCapo,
                  likedOnly: likedOnly || undefined,
                  folderId:
                    currentFolder === 'unorganized'
                      ? 'unorganized'
                      : currentFolder || undefined,
                }}
              />
              <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
              {searchQuery.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-[44px] w-full"
                  onClick={() => openAddSongPageForArtist(searchQuery.trim())}
                >
                  {t('songs.searchMoreFromArtist').replace('{artist}', searchQuery.trim())}
                </Button>
              )}
            </>
          ) : (
            <>
              <SongGallery songs={sortedSongs} />
              <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
              {searchQuery.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-[44px] w-full"
                  onClick={() => openAddSongPageForArtist(searchQuery.trim())}
                >
                  {t('songs.searchMoreFromArtist').replace('{artist}', searchQuery.trim())}
                </Button>
              )}
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
          showCloseButton={false}
          className="flex h-[85vh] max-h-[640px] flex-col rounded-t-[1.75rem] border-0 bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {/* Bar + Close aligned on same row */}
          <div className="shrink-0 flex items-center py-1.5 -mt-1">
            <div className="flex-1" aria-hidden />
            <div className="w-14 h-1 rounded-full bg-muted-foreground/25 cursor-ns-resize touch-none shrink-0" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-w-[24px] min-h-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>

          <SheetHeader className="shrink-0 px-1 pb-2">
            <SheetTitle className="text-xl font-semibold">{t('songs.advancedFilters')}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4 px-1">
            {/* Folder Selection - card style */}
            <div className="space-y-2.5 py-1">
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
            <div className="space-y-2.5 py-1">
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
            <div className="space-y-2.5 py-1">
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

            {/* Accord facile - toggle buttons */}
            <div className="space-y-2.5 py-1">
              <Label className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.easyChord')}
              </Label>
              <div className="flex rounded-full bg-muted/80 dark:bg-gray-800 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setFilterEasyChord(false)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-full min-h-[40px] transition-all duration-200 ${
                    !filterEasyChord
                      ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.easyChordAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterEasyChord(true)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-full min-h-[40px] transition-all duration-200 ${
                    filterEasyChord
                      ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.easyChordOnly')}
                </button>
              </div>
            </div>

            {/* Capo - toggle buttons */}
            <div className="space-y-2.5 py-1">
              <Label className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.capo')}
              </Label>
              <div className="flex rounded-full bg-muted/80 dark:bg-gray-800 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setFilterCapo('any')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium rounded-full min-h-[40px] transition-all duration-200 ${
                    filterCapo === 'any'
                      ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.capoAny')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCapo('with')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium rounded-full min-h-[40px] transition-all duration-200 ${
                    filterCapo === 'with'
                      ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.capoWith')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCapo('without')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium rounded-full min-h-[40px] transition-all duration-200 ${
                    filterCapo === 'without'
                      ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.capoWithout')}
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 safe-area-inset-bottom">
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
