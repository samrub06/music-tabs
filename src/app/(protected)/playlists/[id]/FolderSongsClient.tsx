'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline'
import { usePageHeader } from '@/context/PageHeaderContext'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Song, Folder } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction } from '@/app/(protected)/dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import DragDropOverlay from '@/components/DragDropOverlay'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortField, SortDirection } from '@/components/SortSelectionModal'

interface FolderSongsClientProps {
  folder: Folder
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  initialSortOrder?: 'asc' | 'desc'
}

const FOLDER_SORT_FIELDS: SortField[] = ['title', 'author', 'updatedAt', 'viewCount']

export default function FolderSongsClient({
  folder,
  songs,
  total,
  page,
  limit,
  initialView = 'gallery',
  initialQuery = '',
  initialSortOrder = 'asc',
}: FolderSongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)
  const [isInputFocused, setIsInputFocused] = useState(false)

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
    createdAt: t('songs.createdAt'),
  }

  // Search state
  const [localSearchValue, setLocalSearchValue] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  // Filter state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortOrder)
  const [draftSortField, setDraftSortField] = useState<SortField>('title')
  const [draftSortDirection, setDraftSortDirection] = useState<SortDirection>(initialSortOrder)

  const hasActiveFilters = sortField !== 'title' || sortDirection !== 'asc'

  // Other state
  const [currentFolder, setCurrentFolder] = useState<string | null>(folder.id)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    const prefetchPage = (nextPage: number) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('page', String(nextPage))
      params.set('limit', String(limit))
      router.prefetch(`${pathname}?${params.toString()}`)
    }

    if (page > 1) prefetchPage(page - 1)
    if (page < totalPages) prefetchPage(page + 1)
  }, [page, limit, totalPages, pathname, searchParams, router])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView

  usePageHeader(folder.name, '/playlists')

  // Sync local search from URL
  useEffect(() => {
    setLocalSearchValue(initialQuery)
    setSearchQuery(initialQuery)
  }, [initialQuery])

  // Debounced search - update URL with q
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearchValue.trim()
      setSearchQuery(trimmed)
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (trimmed) {
        params.set('q', trimmed)
        params.set('page', '1')
      } else {
        params.delete('q')
        params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchValue, pathname, router, searchParams])

  // Sync sortOrder from URL
  useEffect(() => {
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    if (sortOrderFromUrl === 'desc' || sortOrderFromUrl === 'asc') {
      setSortDirection(sortOrderFromUrl)
    }
  }, [searchParams])

  // Mouse only — touch drag on song vignettes breaks scrolling on phone
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const song = songs.find((s) => s.id === active.id)
    setDraggedSong(song || null)
  }

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
        const folderName = folderId ? folder.name : t('songs.unorganized')
        const songTitle = draggedSong?.title || t('songs.theSong')
        setSuccessMessage(`"${songTitle}" ${t('songs.songMoved')} ${t('songs.inFolder')} ${folderName}`)
        router.refresh()
      } catch (err) {
        console.error('Error moving song to folder:', err)
        setError(t('songs.moveError'))
      }
    }
  }

  const applyQuery = (next: { q?: string; view?: 'gallery' | 'table'; page?: number; limit?: number; sortOrder?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q)
      else params.delete('q')
    }
    if (next.view) params.set('view', next.view)
    if (next.page) params.set('page', String(next.page))
    if (next.limit) params.set('limit', String(next.limit))
    else if (!params.has('limit')) params.set('limit', String(limit))
    if (next.sortOrder !== undefined) {
      if (next.sortOrder) params.set('sortOrder', next.sortOrder)
      else params.delete('sortOrder')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
    applyQuery({ q: '', page: 1 })
  }

  const handleApplyFilters = () => {
    setSortField(draftSortField)
    setSortDirection(draftSortDirection)
    applyQuery({ sortOrder: draftSortDirection, page: 1 })
    setIsFilterSheetOpen(false)
  }

  const handleClearFilters = () => {
    setDraftSortField('title')
    setDraftSortDirection('asc')
    setSortField('title')
    setSortDirection('asc')
    applyQuery({ sortOrder: 'asc', page: 1 })
    setIsFilterSheetOpen(false)
  }

  const openFilterSheet = () => {
    setDraftSortField(sortField)
    setDraftSortDirection(sortDirection)
    setIsFilterSheetOpen(true)
  }

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
    applyQuery({ sortOrder: direction, page: 1 })
  }

  // Client-side sort and search filter (search is server-side via q; we filter displayed list for consistency)
  const sortedSongs = useMemo(() => {
    let list = [...songs]
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (song) =>
          song.title.toLowerCase().includes(q) ||
          song.author.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let aVal: string | number | Date | undefined
      let bVal: string | number | Date | undefined
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
        case 'author':
          aVal = (a.author || '').toLowerCase()
          bVal = (b.author || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
        case 'updatedAt':
          aVal = new Date(a.updatedAt).getTime()
          bVal = new Date(b.updatedAt).getTime()
          return (aVal as number) - (bVal as number)
        case 'viewCount':
          aVal = a.viewCount ?? 0
          bVal = b.viewCount ?? 0
          return (aVal as number) - (bVal as number)
        default:
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
      }
    })
    if (sortDirection === 'desc') list.reverse()
    return list
  }, [songs, searchQuery, sortField, sortDirection])

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
        <div className={cn('relative shrink-0 pb-4', isInputFocused && 'z-30')}>
          <div className="flex items-stretch gap-2 max-lg:transition-[gap] max-lg:duration-200">
            <div
              className={cn(
                'relative min-w-0 transition-[flex] duration-200',
                isInputFocused ? 'flex-1 max-lg:flex-[1_1_100%]' : 'flex-1'
              )}
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsInputFocused(false), 150)}
                  placeholder={t('songs.search')}
                  className="block w-full rounded-xl border border-border bg-card py-3 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-4"
                />
                {localSearchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center pr-4 text-muted-foreground hover:text-foreground"
                    aria-label={t('common.clear')}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={openFilterSheet}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-background p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
                hasActiveFilters && 'border-primary/40 text-primary',
                isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
              )}
              aria-label={t('songs.advancedFilters')}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 max-lg:shrink-0" />
              {hasActiveFilters && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800">
            <button
              type="button"
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4 ${
                view === 'gallery'
                  ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
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
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4 ${
                view === 'table'
                  ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
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
                folders={[folder]}
                playlists={[]}
                currentFolder={currentFolder}
                currentPlaylistId={currentPlaylistId}
                searchQuery={searchQuery}
                hasUser={true}
                onFolderChange={updateSongFolderAction}
                onDeleteSongs={deleteSongsAction}
                onDeleteAllSongs={deleteAllSongsAction}
                onCurrentFolderChange={setCurrentFolder}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
              <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
            </>
          ) : (
            <>
              <SongGallery songs={sortedSongs} variant="folder" hasUser />
              <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
            </>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery.trim() ? t('songs.noResults') : t('folders.noSongsInFolder')}
            </p>
          </div>
        )}
        </div>
      </div>

      <DragOverlay>
        {draggedSong ? (
          <div className="opacity-90 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-500 p-3 max-w-[200px]">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{draggedSong.title}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{draggedSong.author}</div>
          </div>
        ) : null}
      </DragOverlay>

      <DragDropOverlay folders={[folder]} isDragging={activeId !== null} />

      <Snackbar
        message={successMessage || ''}
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        type="success"
        duration={3000}
      />
      <Snackbar
        message={error || ''}
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        duration={5000}
      />

      {/* Filter Sheet - same style as /songs */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[85vh] max-h-[640px] flex-col rounded-t-[1.75rem] border-0 bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden"
        >
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
              <Select value={draftSortField} onValueChange={(value) => setDraftSortField(value as SortField)}>
                <SelectTrigger
                  id="sortField"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_SORT_FIELDS.map((field) => (
                    <SelectItem key={field} value={field}>
                      {sortFieldLabels[field]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 py-1">
              <Label htmlFor="sortDirection" className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.sortOrder')}
              </Label>
              <Select value={draftSortDirection} onValueChange={(value) => setDraftSortDirection(value as SortDirection)}>
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
          </div>

          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 safe-area-inset-bottom">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
            >
              {t('common.clear')}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial">
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}
