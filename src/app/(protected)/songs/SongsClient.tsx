'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon, MusicalNoteIcon, ClockIcon, FireIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteScrollLoadMore } from '@/lib/hooks/useInfiniteScrollLoadMore'
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

const toolbarSegmentContainer =
  'flex items-center gap-0.5 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800'

function toolbarSegmentButton(
  active: boolean,
  className?: string,
  compact = false
) {
  return cn(
    'flex items-center justify-center rounded-full font-medium transition-all duration-300 ease-out',
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
export type DifficultyMaxFilter = 1 | 2 | 3 | 4 | null

const DIFFICULTY_LEVELS: Array<{ value: DifficultyMaxFilter; labelKey: string }> = [
  { value: null, labelKey: 'difficultyAny' },
  { value: 1, labelKey: 'difficultyAbsoluteBeginner' },
  { value: 2, labelKey: 'difficultyBeginner' },
  { value: 3, labelKey: 'difficultyIntermediate' },
  { value: 4, labelKey: 'difficultyAdvanced' },
]

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
  initialDifficultyMax?: DifficultyMaxFilter
  initialCapoFilter?: CapoFilter
  likedOnly?: boolean
  folderSongCounts?: FolderSongCounts
}

export default function SongsClient({ songs, total, page, limit, initialView = 'gallery', initialTab = 'all', playlists = [], initialSongId, initialFolder, initialSortOrder = 'asc', initialEasyChord = false, initialDifficultyMax = null, initialCapoFilter = 'any', likedOnly = false, folderSongCounts = {} }: SongsClientProps) {
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
  const [filterDifficultyMax, setFilterDifficultyMax] = useState<DifficultyMaxFilter>(
    initialDifficultyMax ?? (initialEasyChord ? 2 : null)
  )
  const [filterCapo, setFilterCapo] = useState<CapoFilter>(initialCapoFilter)
  
  // Other state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(selectedFolder || null)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>(initialTab)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [view, setView] = useState<'gallery' | 'table'>(() =>
    initialView === 'table' ? 'table' : 'gallery'
  )
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

  const handleViewChange = useCallback(
    (next: 'gallery' | 'table') => {
      if (next === view) return
      setView(next)
      replaceQueryParams((params) => {
        if (next === 'gallery') params.delete('view')
        else params.set('view', next)
      })
    },
    [view, replaceQueryParams]
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

  const listFilterKey = useMemo(
    () =>
      [
        activeTab,
        currentFolder ?? '',
        filterDifficultyMax ?? '',
        filterCapo,
        likedOnly ? '1' : '0',
        limit,
      ].join(':'),
    [activeTab, currentFolder, filterDifficultyMax, filterCapo, likedOnly, limit]
  )
  const prevListFilterKeyRef = useRef(listFilterKey)

  // Sync from RSC when server props change. Client live filter updates go through
  // fetchSongList — never stomp those with stale RSC props on filter-key alone.
  useEffect(() => {
    const filtersChanged = prevListFilterKeyRef.current !== listFilterKey
    prevListFilterKeyRef.current = listFilterKey

    if (searchQuery.trim()) return

    if (filtersChanged) {
      setSearchPage(1)
      return
    }

    if (searchPage <= 1) {
      setDisplaySongs(songs)
      setDisplayTotal(total)
    }
  }, [songs, total, listFilterKey, searchQuery, searchPage])

  const listLoadingLockRef = useRef(false)

  const fetchSongList = useCallback(
    async (overrides?: {
      page?: number
      searchQuery?: string
      folder?: string | undefined
      tab?: 'all' | 'recent' | 'popular'
      difficultyMax?: DifficultyMaxFilter
      capo?: CapoFilter
      append?: boolean
    }) => {
      if (overrides?.append && listLoadingLockRef.current) return
      if (overrides?.append) listLoadingLockRef.current = true
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

        const difficultyMax =
          overrides?.difficultyMax !== undefined
            ? overrides.difficultyMax
            : filterDifficultyMax

        const nextPage = overrides?.page ?? 1
        const result = await fetchUserSongsListAction({
          page: nextPage,
          limit,
          searchQuery: searchValue || undefined,
          tab: overrides?.tab ?? activeTab,
          folder:
            folderValue === 'unorganized'
              ? 'unorganized'
              : folderValue || undefined,
          difficultyMax: difficultyMax ?? undefined,
          capo: overrides?.capo ?? filterCapo,
          likedOnly: likedOnly || undefined,
        })
        setDisplaySongs((prev) => {
          if (!overrides?.append) return result.songs
          const seen = new Set(prev.map((s) => s.id))
          const merged = [...prev]
          for (const song of result.songs) {
            if (!seen.has(song.id)) {
              seen.add(song.id)
              merged.push(song)
            }
          }
          return merged
        })
        setDisplayTotal(result.total)
        setSearchPage(nextPage)
        // Do not write `page` into the URL — that remounts RSC and wipes appends.
      } catch (error) {
        console.error('Error fetching songs:', error)
      } finally {
        listLoadingLockRef.current = false
        setIsListLoading(false)
      }
    },
    [
      limit,
      activeTab,
      currentFolder,
      filterDifficultyMax,
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

      // Refetch with current tab/folder — don't reset to stale RSC props
      void fetchSongList({ page: 1, searchQuery: '' })
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchValue, fetchSongList])

  // Handle songId from URL - navigate to song page if present
  useEffect(() => {
    const songIdFromUrl = searchParams?.get('songId')
    if (songIdFromUrl) {
      router.push(`/song/${songIdFromUrl}`)
    }
  }, [searchParams, router])

  // Sync folder, sortOrder, tab, difficulty, capo from URL
  useEffect(() => {
    const folderFromUrl = searchParams?.get('folder')
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    const tabFromUrl = searchParams?.get('tab')
    const difficultyFromUrl = searchParams?.get('difficulty')
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
    if (difficultyFromUrl === '1' || difficultyFromUrl === '2' || difficultyFromUrl === '3' || difficultyFromUrl === '4') {
      setFilterDifficultyMax(Number(difficultyFromUrl) as 1 | 2 | 3 | 4)
    } else if (easyChordFromUrl === '1' || easyChordFromUrl === 'true') {
      setFilterDifficultyMax(2)
    } else {
      setFilterDifficultyMax(null)
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

  /** Live advanced filters: update URL (replaceState) + refetch when server filters change. Preserves search. */
  const updateListFilters = useCallback(
    (next: {
      sortField?: SortField
      sortDirection?: SortDirection
      difficultyMax?: DifficultyMaxFilter
      capo?: CapoFilter
    }) => {
      const nextSortDirection =
        next.sortDirection !== undefined ? next.sortDirection : sortDirection
      const nextDifficulty =
        next.difficultyMax !== undefined ? next.difficultyMax : filterDifficultyMax
      const nextCapo = next.capo !== undefined ? next.capo : filterCapo

      if (next.sortField !== undefined) setSortField(next.sortField)
      if (next.sortDirection !== undefined) setSortDirection(next.sortDirection)
      if (next.difficultyMax !== undefined) setFilterDifficultyMax(next.difficultyMax)
      if (next.capo !== undefined) setFilterCapo(next.capo)

      replaceQueryParams((params) => {
        params.set('page', '1')
        if (nextSortDirection === 'desc') params.set('sortOrder', 'desc')
        else params.delete('sortOrder')
        if (nextDifficulty != null) {
          params.set('difficulty', String(nextDifficulty))
          params.delete('easyChord')
        } else {
          params.delete('difficulty')
          params.delete('easyChord')
        }
        if (nextCapo !== 'any') params.set('capo', nextCapo)
        else params.delete('capo')
      })

      const needsServerFetch =
        next.difficultyMax !== undefined || next.capo !== undefined
      if (needsServerFetch) {
        void fetchSongList({
          page: 1,
          difficultyMax: nextDifficulty,
          capo: nextCapo,
          searchQuery: searchQuery.trim() || undefined,
        })
      }
    },
    [
      sortDirection,
      filterDifficultyMax,
      filterCapo,
      replaceQueryParams,
      fetchSongList,
      searchQuery,
    ]
  )

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

  const handleTabChange = (tab: 'all' | 'recent' | 'popular') => {
    if (tab === activeTab && !isListLoading) return

    setActiveTab(tab)
    replaceQueryParams((params) => {
      if (tab !== 'all') params.set('tab', tab)
      else params.delete('tab')
      params.set('page', '1')
    })

    void fetchSongList({
      tab,
      page: 1,
      searchQuery: searchQuery.trim() || undefined,
    })
  }

  const handleCreateFolder = async (name: string) => {
    await addFolderAction(name)
    await refreshFolders()
    router.refresh()
  }

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    updateListFilters({ sortField: field, sortDirection: direction })
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
  const displayPage = Math.max(1, searchPage)

  const hasMoreSongs = displaySongs.length < displayTotal
  const handleLoadMoreSongs = useCallback(() => {
    if (isListLoading || !hasMoreSongs) return
    void fetchSongList({
      page: displayPage + 1,
      searchQuery: searchQuery.trim() || undefined,
      append: true,
    })
  }, [isListLoading, hasMoreSongs, fetchSongList, displayPage, searchQuery])

  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const setScrollContainerNode = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node
    setScrollRoot(node)
  }, [])

  const loadMoreSentinelRef = useInfiniteScrollLoadMore({
    enabled: true,
    hasMore: hasMoreSongs,
    loading: isListLoading,
    onLoadMore: handleLoadMoreSongs,
    root: scrollRoot,
  })

  const hasActiveFilters =
    sortField !== 'title' ||
    sortDirection !== 'asc' ||
    filterDifficultyMax != null ||
    filterCapo !== 'any'

  // Clear filters live (sheet stays open so results stay visible)
  const handleClearFilters = () => {
    setSortField('title')
    setSortDirection('asc')
    setFilterDifficultyMax(null)
    setFilterCapo('any')
    replaceQueryParams((params) => {
      params.set('page', '1')
      params.delete('sortOrder')
      params.delete('difficulty')
      params.delete('easyChord')
      params.delete('capo')
    })
    void fetchSongList({
      page: 1,
      difficultyMax: null,
      capo: 'any',
      searchQuery: searchQuery.trim() || undefined,
    })
  }

  const filterResultsLabel = t('songs.filterResultsCount').replace(
    '{count}',
    String(displayTotal)
  )
  const seeResultsLabel = t('songs.seeResults').replace(
    '{count}',
    String(displayTotal)
  )

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
            isLandscapeMobile ? 'px-1.5 pt-1.5' : 'px-3 pt-3 sm:px-6 sm:pt-1'
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
              'relative shrink-0 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center',
              isLandscapeMobile ? 'h-8 w-8 p-0' : 'p-3 min-h-[44px] min-w-[44px]',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:opacity-0 max-lg:p-0',
              hasActiveFilters && 'text-primary hover:text-primary'
            )}
            aria-label={t('songs.filters')}
          >
            <AdjustmentsHorizontalIcon
              className={cn('max-lg:shrink-0', isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')}
            />
            {hasActiveFilters && (
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => openAddSongModal()}
            className={cn(
              'group/wiggle shrink-0 rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center',
              isLandscapeMobile ? 'h-8 w-8 p-0' : 'p-3 min-h-[44px] min-w-[44px]',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:opacity-0 max-lg:p-0'
            )}
            aria-label={t('navigation.addSong')}
          >
            <PlusIcon
              className={cn(
                'icon-hover-wiggle',
                isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
              )}
            />
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
            <div className={cn(toolbarSegmentContainer, 'shrink-0')}>
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={toolbarSegmentButton(activeTab === 'all', undefined, true)}
                title={t('songs.all')}
                aria-label={t('songs.all')}
              >
                <MusicalNoteIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('recent')}
                className={toolbarSegmentButton(activeTab === 'recent', undefined, true)}
                title={t('songs.recent')}
                aria-label={t('songs.recent')}
              >
                <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('popular')}
                className={toolbarSegmentButton(activeTab === 'popular', undefined, true)}
                title={t('songs.popular')}
                aria-label={t('songs.popular')}
              >
                <FireIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
            </div>
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
                onClick={() => handleViewChange('gallery')}
                title={t('songs.galleryView')}
                aria-label={t('songs.galleryView')}
              >
                <Squares2X2Icon className="h-3.5 w-3.5 flex-shrink-0" />
              </button>
              <button
                type="button"
                className={toolbarSegmentButton(view === 'table', undefined, true)}
                onClick={() => handleViewChange('table')}
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
                <div className={cn(toolbarSegmentContainer, 'w-full')}>
                  <button
                    type="button"
                    onClick={() => handleTabChange('all')}
                    className={toolbarSegmentButton(activeTab === 'all', 'flex-1')}
                  >
                    <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('songs.all')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('recent')}
                    className={toolbarSegmentButton(activeTab === 'recent', 'flex-1')}
                  >
                    <ClockIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('songs.recent')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('popular')}
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
                  onClick={() => handleViewChange('gallery')}
                  title={t('songs.galleryView')}
                >
                  <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{t('songs.galleryView')}</span>
                </button>
                <button
                  type="button"
                  className={toolbarSegmentButton(view === 'table')}
                  onClick={() => handleViewChange('table')}
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
          ref={setScrollContainerNode}
          data-main-scroll
          className={cn(
            'relative z-0 min-h-0 flex-1 overscroll-contain',
            isLandscapeMobile
              ? 'flex flex-col overflow-hidden'
              : 'overflow-y-auto'
          )}
        >
        <div
          className={cn(
            'transition-opacity duration-300 ease-out',
            isLandscapeMobile && 'flex min-h-0 flex-1 flex-col',
            // Dim only on full replace — keep list visible while appending pages.
            isListLoading && displayPage <= 1
              ? 'pointer-events-none opacity-45'
              : 'opacity-100'
          )}
          aria-busy={isListLoading && displayPage <= 1}
        >
        {sortedSongs && sortedSongs.length > 0 ? (
          view === 'table' && !isLandscapeMobile ? (
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
                  difficultyMax: filterDifficultyMax ?? undefined,
                  capoFilter: filterCapo,
                  likedOnly: likedOnly || undefined,
                  folderId:
                    currentFolder === 'unorganized'
                      ? 'unorganized'
                      : currentFolder || undefined,
                }}
              />
              <div ref={loadMoreSentinelRef} className="h-8 w-full" aria-hidden />
              {isListLoading && hasMoreSongs ? (
                <p className="py-3 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : null}
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
              <SongGallery songs={sortedSongs} variant="folder" hasUser diskRackOnLandscape />
              <div ref={loadMoreSentinelRef} className="h-8 w-full" aria-hidden />
              {isListLoading && hasMoreSongs ? (
                <p className="py-3 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : null}
              {searchQuery.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-[44px] w-full"
                  onClick={() => openAddSongPageForArtist(searchQuery.trim())}
                >
                  {t('songs.searchMoreFromArtist').replace(
                    '{artist}',
                    searchQuery.trim()
                  )}
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

      {/* Advanced Filter Sheet — live preview (list stays visible behind) */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="bg-black/35 dark:bg-black/50"
          className="flex h-auto max-h-[min(52vh,440px)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] bg-background/95 p-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-background/98 dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
        >
          {/* Bar + Close aligned on same row */}
          <div className="flex shrink-0 items-center px-4 py-1.5">
            <div className="flex-1" aria-hidden />
            <div className="h-1 w-14 shrink-0 touch-none rounded-full bg-muted-foreground/25" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>

          <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start sm:text-start">
            <SheetTitle className="text-xl font-semibold">{t('songs.advancedFilters')}</SheetTitle>
            <p
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {isListLoading ? t('common.loading') : filterResultsLabel}
            </p>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-3">
            <div className="space-y-2">
              <Label
                htmlFor="sortField"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                {t('songs.sortBy')}
              </Label>
              <Select
                value={sortField}
                onValueChange={(value) =>
                  updateListFilters({ sortField: value as SortField })
                }
              >
                <SelectTrigger
                  id="sortField"
                  className="h-11 w-full rounded-xl border-border/70 bg-muted/40 px-3 shadow-none focus:ring-0"
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
              <div
                className="flex rounded-full bg-muted/80 p-0.5 gap-0.5"
                role="group"
                aria-label={t('songs.sortOrder')}
              >
                <button
                  type="button"
                  onClick={() => updateListFilters({ sortDirection: 'asc' })}
                  className={cn(
                    'flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200 min-h-[40px]',
                    sortDirection === 'asc'
                      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('songs.ascending')}
                </button>
                <button
                  type="button"
                  onClick={() => updateListFilters({ sortDirection: 'desc' })}
                  className={cn(
                    'flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200 min-h-[40px]',
                    sortDirection === 'desc'
                      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('songs.descending')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-[11px] font-medium text-muted-foreground">
                {t('songs.difficultyFilter')}
              </Label>
              <div
                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="listbox"
                aria-label={t('songs.difficultyFilter')}
              >
                {DIFFICULTY_LEVELS.map((level) => {
                  const active = filterDifficultyMax === level.value
                  return (
                    <button
                      key={level.labelKey}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() =>
                        updateListFilters({ difficultyMax: level.value })
                      }
                      className={cn(
                        'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium min-h-[40px] transition-all duration-200',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-white/[0.06]'
                      )}
                    >
                      {t(`songs.${level.labelKey}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-[11px] font-medium text-muted-foreground">
                {t('songs.capo')}
              </Label>
              <div className="flex rounded-full bg-muted/80 p-0.5 gap-0.5">
                {(
                  [
                    { value: 'any' as const, label: t('songs.capoAny') },
                    { value: 'with' as const, label: t('songs.capoWith') },
                    { value: 'without' as const, label: t('songs.capoWithout') },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateListFilters({ capo: opt.value })}
                    className={cn(
                      'flex-1 rounded-full py-2 text-sm font-medium min-h-[40px] transition-all duration-200',
                      filterCapo === opt.value
                        ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="safe-area-inset-bottom flex shrink-0 flex-row gap-3 border-t border-black/[0.06] px-5 py-3 pb-6 dark:border-white/[0.08]">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {t('common.clear')}
            </Button>
            <Button
              onClick={() => setIsFilterSheetOpen(false)}
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {isListLoading ? t('common.loading') : seeResultsLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </DndContext>
  )
}
