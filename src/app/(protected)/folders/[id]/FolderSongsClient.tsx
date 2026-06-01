'use client'

import SongTable from '@/components/SongTable'
import SongGallery from '@/components/SongGallery'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, TableCellsIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Song, Folder } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from '@/app/(protected)/dashboard/actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
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
  initialView = 'table',
  initialQuery = '',
  initialSortOrder = 'asc',
}: FolderSongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Other state
  const [currentFolder, setCurrentFolder] = useState<string | null>(folder.id)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSong, setDraggedSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
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
    applyQuery({ sortOrder: sortDirection, page: 1 })
    setIsFilterSheetOpen(false)
  }

  const handleClearFilters = () => {
    setSortField('title')
    setSortDirection('asc')
    applyQuery({ sortOrder: 'asc', page: 1 })
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
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Back + title */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => router.push('/folders')}
              className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              {t('folders.backToFolders')}
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
              {folder.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('folders.songsInFolder').replace('{count}', String(total))}
            </p>
          </div>
        </div>

        {/* Search + Filter - same row as /songs */}
        <div className="mb-4 flex items-stretch gap-2">
          <div className="flex-1 min-w-0 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
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
          </div>
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            aria-label={t('songs.filters')}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        {/* View toggle - same pill style as /songs */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1 rounded-full bg-muted/80 dark:bg-gray-800 p-0.5 shrink-0">
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

        {/* Content */}
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
                onUpdateSong={updateSongAction}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
              <Pagination page={page} limit={limit} total={total} showAllLimit={10000} />
            </>
          ) : (
            <>
              <SongGallery songs={sortedSongs} hasUser={true} />
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

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4 px-1">
            <div className="space-y-2.5 py-1">
              <Label htmlFor="sortField" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortBy')}
              </Label>
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger id="sortField" className="h-10 rounded-xl">
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

            <div className="space-y-2.5 py-1">
              <Label htmlFor="sortDirection" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortOrder')}
              </Label>
              <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as SortDirection)}>
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
