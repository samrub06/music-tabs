'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon, MusicalNoteIcon, ClockIcon, FireIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Song, Playlist } from '@/types'
import { useFoldersContext } from '@/context/FoldersContext'
import { addFolderAction, updateSongFolderAction, deleteSongsAction, deleteAllSongsAction } from '../dashboard/actions'
import { fetchUserSongsListAction } from './actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAddSongModal } from '@/context/AddSongModalContext'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortField, SortDirection } from '@/components/SortSelectionModal'
import { SongsFolderChips, SongsFolderSidebar, type FolderSongCounts } from '@/components/songs/SongsFolderNav'
import { SelectModeToggleButton } from '@/components/song-table/SongTableHeader'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'

const toolbarSegmentContainer =
  'flex items-center gap-0.5 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800'

function toolbarSegmentButton(
  active: boolean,
  className?: string,
  compact = false
) {
  return cn(
    'flex items-center justify-center rounded-full font-medium transition-all duration-200',
    compact
      ? 'h-8 gap-1 px-1.5 text-xs'
      : 'h-11 gap-1.5 px-2 text-sm sm:gap-2 sm:px-4',
    active
      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
      : 'text-muted-foreground hover:text-foreground',
    className
  )
}

export type CapoFilter = 'any' | 'with' | 'without'

interface SongsClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialTab?: 'all' | 'recent' | 'popular'
  playlists?: Playlist[]
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
  initialEasyChord?: boolean
  initialCapoFilter?: CapoFilter
  likedOnly?: boolean
  folderSongCounts?: FolderSongCounts
}

export default function SongsClient({ songs, total, page, limit, initialView = 'gallery', initialTab = 'all', playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc', initialEasyChord = false, initialCapoFilter = 'any', likedOnly = false, folderSongCounts = {} }: SongsClientProps) {
  const { t } = useLanguage()
  const { folders, refreshFolders } = useFoldersContext()
  const isLandscapeMobile = useLandscapeMobile()

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
  
  // Search state (ephemeral — not persisted in URL or localStorage)
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchValue, setLocalSearchValue] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [displaySongs, setDisplaySongs] = useState(songs)
  const [displayTotal, setDisplayTotal] = useState(total)
  const [isListLoading, setIsListLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const prevDebouncedSearchRef = useRef('')
  const initialSearchHandledRef = useRef(false)
  
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
  const totalPages = Math.max(1, Math.ceil(displayTotal / limit))
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

  const replaceQueryParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      mutate(params)
      const query = params.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [pathname, searchParams]
  )

  // One-shot deep link: apply search from URL once, then strip it so it is not cached
  useEffect(() => {
    if (initialSearchHandledRef.current) return
    initialSearchHandledRef.current = true

    const q = searchParams?.get('searchQuery')?.trim()
    if (!q) return

    setLocalSearchValue(q)
    replaceQueryParams((params) => {
      params.delete('searchQuery')
      params.set('page', '1')
    })
  }, [searchParams, replaceQueryParams])

  // Sync list from server when not searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplaySongs(songs)
      setDisplayTotal(total)
      setSearchPage(page)
    }
  }, [songs, total, page, searchQuery])

  const fetchSongList = useCallback(
    async (overrides?: {
      page?: number
      searchQuery?: string
      folder?: string | undefined
      tab?: 'all' | 'recent' | 'popular'
      easyChord?: boolean
      capo?: CapoFilter
    }) => {
      setIsListLoading(true)
      try {
        const folderValue =
          overrides?.folder !== undefined
            ? overrides.folder
            : currentFolder === 'unorganized'
              ? 'unorganized'
              : currentFolder || undefined

        const searchValue =
          overrides?.searchQuery !== undefined ? overrides.searchQuery : searchQuery.trim()

        const result = await fetchUserSongsListAction({
          page: overrides?.page ?? 1,
          limit,
          searchQuery: searchValue || undefined,
          tab: overrides?.tab ?? activeTab,
          folder:
            folderValue === 'unorganized'
              ? 'unorganized'
              : folderValue || undefined,
          easyChord: overrides?.easyChord ?? (filterEasyChord || undefined),
          capo: overrides?.capo ?? filterCapo,
          likedOnly: likedOnly || undefined,
        })
        setDisplaySongs(result.songs)
        setDisplayTotal(result.total)
      } catch (error) {
        console.error('Error fetching songs:', error)
      } finally {
        setIsListLoading(false)
      }
    },
    [
      limit,
      activeTab,
      currentFolder,
      filterEasyChord,
      filterCapo,
      likedOnly,
      searchQuery,
    ]
  )

  // Debounced search — client-side fetch only, no URL persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearchValue.trim()
      setSearchQuery(trimmed)

      if (trimmed === prevDebouncedSearchRef.current) return
      prevDebouncedSearchRef.current = trimmed
      setSearchPage(1)

      if (trimmed) {
        void fetchSongList({ page: 1, searchQuery: trimmed })
        return
      }

      setDisplaySongs(songs)
      setDisplayTotal(total)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchValue, fetchSongList, songs, total])

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
    } else {
      setSelectedFolder(undefined)
      setCurrentFolder(null)
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

  // Mouse only — touch drag on song vignettes breaks scrolling on phone
  const sensors = useSensors(
    useSensor(MouseSensor, {
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
    let filtered = [...displaySongs]

    if (currentFolder === 'unorganized') {
      filtered = filtered.filter(song => !song.folderId)
    } else if (currentFolder) {
      filtered = filtered.filter(song => song.folderId === currentFolder)
    }

    return filtered
  }, [displaySongs, currentFolder])

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

  const applyQuery = (next: { view?: 'gallery' | 'table'; page?: number; limit?: number; songId?: string; folder?: string; sortOrder?: 'asc' | 'desc'; tab?: 'all' | 'recent' | 'popular'; easyChord?: boolean; capo?: CapoFilter }) => {
    setLocalSearchValue('')
    setSearchQuery('')
    prevDebouncedSearchRef.current = ''
    setSearchPage(1)

    const params = new URLSearchParams(searchParams?.toString() || '')
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

    replaceQueryParams((params) => {
      if (folderId) params.set('folder', folderId)
      else params.delete('folder')
      params.set('page', '1')
    })

    void fetchSongList({ folder: folderId, page: 1 })
  }

  const handleCreateFolder = async (name: string) => {
    await addFolderAction(name)
    await refreshFolders()
    router.refresh()
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
  }

  const isSearching = searchQuery.trim().length > 0
  const displayPage = isSearching ? searchPage : page

  const handleSearchPaginationNavigate = useCallback(
    (nextPage: number) => {
      setSearchPage(nextPage)
      void fetchSongList({ page: nextPage, searchQuery: searchQuery.trim() })
    },
    [fetchSongList, searchQuery]
  )

  const handleSearchPaginationShowAll = useCallback(() => {
    setSearchPage(1)
    void fetchSongList({ page: 1, searchQuery: searchQuery.trim() })
  }, [fetchSongList, searchQuery])

  // Handle filter apply
  const handleApplyFilters = () => {
    setSortField(sortField)
    setSortDirection(sortDirection)
    applyQuery({
      sortOrder: sortDirection,
      easyChord: filterEasyChord,
      capo: filterCapo,
      page: 1,
    })
    setIsFilterSheetOpen(false)
  }

  // Handle filter clear
  const handleClearFilters = () => {
    setSortField('title')
    setSortDirection('asc')
    setFilterEasyChord(false)
    setFilterCapo('any')
    applyQuery({ sortOrder: 'asc', easyChord: false, capo: 'any', page: 1 })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SongsFolderSidebar
          folders={folders}
          folderSongCounts={folderSongCounts}
          currentFolder={currentFolder}
          onFolderSelect={handleFolderChange}
          onCreateFolder={handleCreateFolder}
          isDragging={activeId !== null}
        />

        <div
          className={cn(
            'flex flex-1 flex-col min-h-0 overflow-hidden min-w-0',
            isLandscapeMobile ? 'p-1.5' : 'p-3 sm:p-6'
          )}
        >
        <div
          className={cn(
            'relative shrink-0',
            isLandscapeMobile ? 'space-y-1 pb-1' : 'space-y-3 pb-4',
            isInputFocused && 'z-30'
          )}
        >
        {likedOnly && (
          <h1
            className={cn(
              'font-semibold text-gray-900 dark:text-gray-100',
              isLandscapeMobile ? 'text-sm' : 'text-lg'
            )}
          >
            {t('library.likedSongs')}
          </h1>
        )}
        <div
          className={cn(
            'flex items-stretch max-lg:transition-[gap] max-lg:duration-200',
            isLandscapeMobile ? 'gap-1.5' : 'gap-2'
          )}
        >
          <div
            className={cn(
              'min-w-0 relative transition-[flex] duration-200',
              isInputFocused ? 'flex-1 max-lg:flex-[1_1_100%]' : 'flex-1'
            )}
          >
            <div className="relative">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 flex items-center pointer-events-none',
                  isLandscapeMobile ? 'pl-2.5' : 'pl-4'
                )}
              >
                <MagnifyingGlassIcon
                  className={cn('text-gray-400', isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')}
                />
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
                className={cn(
                  'block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100',
                  isLandscapeMobile
                    ? 'h-8 pl-8 pr-8 py-1 text-sm'
                    : 'pl-12 pr-12 py-3 sm:py-4 text-base'
                )}
              />
              {localSearchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={cn(
                    'absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 justify-center',
                    isLandscapeMobile
                      ? 'pr-1.5 min-w-8 min-h-8'
                      : 'pr-4 min-w-[44px] min-h-[44px]'
                  )}
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className={cn(isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')} />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={cn(
              'shrink-0 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center',
              isLandscapeMobile ? 'h-8 w-8 p-0' : 'p-3 min-h-[44px] min-w-[44px]',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:opacity-0 max-lg:p-0'
            )}
            aria-label={t('songs.filters')}
          >
            <AdjustmentsHorizontalIcon
              className={cn('max-lg:shrink-0', isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')}
            />
          </button>
          <button
            type="button"
            onClick={() => openAddSongModal()}
            className={cn(
              'shrink-0 rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center',
              isLandscapeMobile ? 'h-8 w-8 p-0' : 'p-3 min-h-[44px] min-w-[44px]',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:opacity-0 max-lg:p-0'
            )}
            aria-label={t('navigation.addSong')}
          >
            <PlusIcon className={isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
        </div>

        {/* Landscape: one strip — folders + tabs + view (hidden while searching) */}
        {isLandscapeMobile && !isInputFocused && (
          <div className="flex min-w-0 items-center gap-1.5">
            <SongsFolderChips
              folders={folders}
              folderSongCounts={folderSongCounts}
              currentFolder={currentFolder}
              onFolderSelect={handleFolderChange}
              compact
            />
            <FilterChipRow className="min-w-0 flex-1">
              <FilterChip
                compact
                active={activeTab === 'all'}
                onClick={() => applyQuery({ tab: 'all', page: 1 })}
                title={t('songs.all')}
                aria-label={t('songs.all')}
              >
                <MusicalNoteIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </FilterChip>
              <FilterChip
                compact
                active={activeTab === 'recent'}
                onClick={() => applyQuery({ tab: 'recent', page: 1 })}
                title={t('songs.recent')}
                aria-label={t('songs.recent')}
              >
                <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </FilterChip>
              <FilterChip
                compact
                active={activeTab === 'popular'}
                onClick={() => applyQuery({ tab: 'popular', page: 1 })}
                title={t('songs.popular')}
                aria-label={t('songs.popular')}
              >
                <FireIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </FilterChip>
            </FilterChipRow>
            <div className={cn(toolbarSegmentContainer, 'shrink-0')}>
              {(view === 'table' || isSelectMode) && (
                <SelectModeToggleButton
                  isSelectMode={isSelectMode}
                  onToggle={toggleSelectMode}
                  t={t}
                  compact
                />
              )}
              <button
                type="button"
                className={toolbarSegmentButton(view === 'gallery', undefined, true)}
                onClick={() => applyQuery({ view: 'gallery', page: 1 })}
                title={t('songs.galleryView')}
                aria-label={t('songs.galleryView')}
              >
                <Squares2X2Icon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
              <button
                type="button"
                className={toolbarSegmentButton(view === 'table', undefined, true)}
                onClick={() => applyQuery({ view: 'table', page: 1 })}
                title={t('songs.tableView')}
                aria-label={t('songs.tableView')}
              >
                <TableCellsIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Portrait / tablet: folder chips, then tabs + view */}
        {!isLandscapeMobile && (
          <>
            <SongsFolderChips
              folders={folders}
              folderSongCounts={folderSongCounts}
              currentFolder={currentFolder}
              onFolderSelect={handleFolderChange}
            />
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 lg:hidden">
                <FilterChipRow>
                  <FilterChip
                    active={activeTab === 'all'}
                    onClick={() => applyQuery({ tab: 'all', page: 1 })}
                  >
                    <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('songs.all')}</span>
                  </FilterChip>
                  <FilterChip
                    active={activeTab === 'recent'}
                    onClick={() => applyQuery({ tab: 'recent', page: 1 })}
                  >
                    <ClockIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('songs.recent')}</span>
                  </FilterChip>
                  <FilterChip
                    active={activeTab === 'popular'}
                    onClick={() => applyQuery({ tab: 'popular', page: 1 })}
                  >
                    <FireIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('songs.popular')}</span>
                  </FilterChip>
                </FilterChipRow>
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
          </>
        )}
        </div>

        <div
          ref={scrollContainerRef}
          data-main-scroll
          className={cn(
            'relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain transition-opacity duration-150',
            isListLoading && 'opacity-60 pointer-events-none'
          )}
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
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                isSelectMode={isSelectMode}
                onToggleSelectMode={toggleSelectMode}
                totalMatchingCount={displayTotal}
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
              <Pagination
                page={displayPage}
                limit={limit}
                total={displayTotal}
                showAllLimit={10000}
                onNavigate={isSearching ? handleSearchPaginationNavigate : undefined}
                onShowAll={isSearching ? handleSearchPaginationShowAll : undefined}
              />
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
              <SongGallery songs={sortedSongs} variant="folder" hasUser />
              <Pagination
                page={displayPage}
                limit={limit}
                total={displayTotal}
                showAllLimit={10000}
                onNavigate={isSearching ? handleSearchPaginationNavigate : undefined}
                onShowAll={isSearching ? handleSearchPaginationShowAll : undefined}
              />
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

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-5 pb-4 px-1">
            <div className="space-y-2 py-1">
              <Label htmlFor="sortField" className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.sortBy')}
              </Label>
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger
                  id="sortField"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
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

            <div className="space-y-2 py-1">
              <Label htmlFor="sortDirection" className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.sortOrder')}
              </Label>
              <Select
                value={sortDirection}
                onValueChange={(value) => setSortDirection(value as SortDirection)}
              >
                <SelectTrigger
                  id="sortDirection"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('songs.ascending')}</SelectItem>
                  <SelectItem value="desc">{t('songs.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 py-1">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.easyChord')}
              </Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFilterEasyChord(false)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium min-h-[40px] border-b-2 transition-colors ${
                    !filterEasyChord
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.easyChordAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterEasyChord(true)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium min-h-[40px] border-b-2 transition-colors ${
                    filterEasyChord
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.easyChordOnly')}
                </button>
              </div>
            </div>

            <div className="space-y-2 py-1">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.capo')}
              </Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFilterCapo('any')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium min-h-[40px] border-b-2 transition-colors ${
                    filterCapo === 'any'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.capoAny')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCapo('with')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium min-h-[40px] border-b-2 transition-colors ${
                    filterCapo === 'with'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('songs.capoWith')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCapo('without')}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium min-h-[40px] border-b-2 transition-colors ${
                    filterCapo === 'without'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
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
