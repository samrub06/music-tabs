'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import { FolderIcon, PlusIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { FolderCover } from '@/components/presentational/FolderCover'
import { Folder } from '@/types'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateFolderOrderAction } from './actions'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FoldersClientProps {
  folders: Folder[]
  folderSongCounts: Map<string, number>
}

interface SortableFolderItemProps {
  folder: Folder
  songCount: number
  onFolderClick: (folderId: string) => void
  isDragMode: boolean
}

interface SortableFolderTableRowProps {
  folder: Folder
  songCount: number
  onFolderClick: (folderId: string) => void
  isDragMode: boolean
}

function FolderListRow({ folder, songCount, onFolderClick, isDragMode }: SortableFolderTableRowProps) {
  const { t } = useLanguage()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id, disabled: !isDragMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onFolderClick(folder.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onFolderClick(folder.id)
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:py-3"
      >
        {isDragMode && (
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Bars3Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <FolderCover imageUrl={folder.imageUrl} songCount={songCount} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{folder.name}</p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {songCount} {songCount === 1 ? t('songs.songCount') : t('songs.songCountPlural')}
          </p>
        </div>
      </div>
    </li>
  )
}

function SortableFolderItem({ folder, songCount, onFolderClick, isDragMode }: SortableFolderItemProps) {
  const { t } = useLanguage()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id, disabled: !isDragMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex min-w-0 cursor-pointer flex-col gap-1.5',
        isDragging && 'opacity-50'
      )}
      onClick={() => onFolderClick(folder.id)}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
        <FolderCover
          imageUrl={folder.imageUrl}
          songCount={songCount}
          shapeClassName="transition-transform duration-200 group-hover:scale-105"
          className="transition-transform duration-200 group-hover:scale-105"
        />
        {isDragMode && (
          <div
            {...attributes}
            {...listeners}
            className="absolute bottom-1.5 right-1.5 touch-none rounded-md bg-background/90 p-1 shadow-sm backdrop-blur-sm"
            style={{ touchAction: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Bars3Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-xs font-medium text-foreground">{folder.name}</h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
          {songCount} {songCount === 1 ? t('songs.songCount') : t('songs.songCountPlural')}
        </p>
      </div>
    </div>
  )
}

export default function FoldersClient({ folders: initialFolders, folderSongCounts }: FoldersClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)

  const [folders, setFolders] = useState(initialFolders)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchValue, setLocalSearchValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'songCount'>('songCount')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [draftSortBy, setDraftSortBy] = useState<'name' | 'createdAt' | 'songCount'>('songCount')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setFolders(initialFolders)
  }, [initialFolders])

  const hasActiveFilters = sortBy !== 'songCount' || sortDirection !== 'desc'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Only enable sensors when drag mode is on
  const activeSensors = isDragMode ? sensors : []

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const folder = folders.find(f => f.id === active.id)
    setDraggedFolder(folder || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setDraggedFolder(null)
    setError(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = folders.findIndex(f => f.id === active.id)
    const newIndex = folders.findIndex(f => f.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Calculate new display_order using decimal values
    const movedFolder = folders[oldIndex]
    let newOrder: number

    // Create a temporary array with the new order to calculate positions correctly
    const tempFolders = arrayMove([...folders], oldIndex, newIndex)

    if (newIndex === 0) {
      // Moved to the beginning
      const firstOrder = tempFolders[1]?.displayOrder
      newOrder = firstOrder !== undefined ? firstOrder - 1.0 : 0.0
    } else if (newIndex === folders.length - 1) {
      // Moved to the end
      const prevOrder = tempFolders[newIndex - 1]?.displayOrder
      newOrder = prevOrder !== undefined ? prevOrder + 1.0 : folders.length
    } else {
      // Moved between two items
      const prevOrder = tempFolders[newIndex - 1]?.displayOrder
      const nextOrder = tempFolders[newIndex + 1]?.displayOrder
      
      if (prevOrder !== undefined && nextOrder !== undefined) {
        newOrder = (prevOrder + nextOrder) / 2
      } else if (prevOrder !== undefined) {
        newOrder = prevOrder + 1.0
      } else if (nextOrder !== undefined) {
        newOrder = nextOrder - 1.0
      } else {
        newOrder = newIndex + 1.0
      }
    }

    // Optimistically update UI
    const newFolders = arrayMove(folders, oldIndex, newIndex)
    setFolders(newFolders)

    try {
      await updateFolderOrderAction(movedFolder.id, newOrder)
      setSuccessMessage(`"${movedFolder.name}" réorganisé avec succès`)
      // Refresh to update sidebar
      router.refresh()
    } catch (error) {
      console.error('Error updating folder order:', error)
      setError(t('folders.reorganizeError'))
      // Revert on error
      setFolders(folders)
    }
  }

  const handleFolderClick = (folderId: string) => {
    router.push(`/playlists/${folderId}`)
  }

  const getSongCount = useCallback((folderId: string) => {
    return folderSongCounts.get(folderId) || 0
  }, [folderSongCounts])

  // Debounced search - update searchQuery after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchValue])

  // Filter and sort folders
  const filteredFolders = useMemo(() => {
    let filtered = [...folders]
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(folder => 
        folder.name.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting (manual order while dragging)
    if (isDragMode) {
      const orderMap = new Map(folders.map((folder, index) => [folder.id, index]))
      filtered.sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      )
    } else {
      filtered.sort((a, b) => {
        let compareA: string | number
        let compareB: string | number
        switch (sortBy) {
          case 'name':
            compareA = a.name.toLowerCase()
            compareB = b.name.toLowerCase()
            break
          case 'createdAt':
            compareA = new Date(a.createdAt).getTime()
            compareB = new Date(b.createdAt).getTime()
            break
          case 'songCount':
            compareA = getSongCount(a.id)
            compareB = getSongCount(b.id)
            break
          default:
            compareA = a.name.toLowerCase()
            compareB = b.name.toLowerCase()
        }

        let result: number
        if (typeof compareA === 'string' && typeof compareB === 'string') {
          result = sortDirection === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA)
        } else {
          result = sortDirection === 'asc' ? (compareA as number) - (compareB as number) : (compareB as number) - (compareA as number)
        }

        if (result !== 0) return result
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      })
    }
    
    return filtered
  }, [folders, searchQuery, sortBy, sortDirection, getSongCount, isDragMode])
  
  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
  }
  
  const handleApplyFilters = () => {
    setSortBy(draftSortBy)
    setSortDirection(draftSortDirection)
    setIsFilterSheetOpen(false)
  }

  const handleClearFilters = () => {
    setDraftSortBy('songCount')
    setDraftSortDirection('desc')
    setSortBy('songCount')
    setSortDirection('desc')
    setIsFilterSheetOpen(false)
  }

  const openFilterSheet = () => {
    setDraftSortBy(sortBy)
    setDraftSortDirection(sortDirection)
    setIsFilterSheetOpen(true)
  }

  return (
    <DndContext
      sensors={activeSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsInputFocused(false), 150)}
                  placeholder={t('folders.searchPlaceholder')}
                  className="block min-h-[44px] w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm leading-normal text-foreground placeholder:text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-4 sm:pl-12 sm:pr-12 sm:text-base sm:placeholder:text-base"
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
            <button
              type="button"
              onClick={() => router.push('/playlists/new')}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t('folders.newFolder')}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setView((current) => (current === 'grid' ? 'list' : 'grid'))}
              className={cn(
                'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
                isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
              )}
              title={view === 'grid' ? t('folders.listView') : t('folders.gridView')}
              aria-label={view === 'grid' ? t('folders.listView') : t('folders.gridView')}
              aria-pressed={view === 'list'}
            >
              {view === 'grid' ? (
                <ListBulletIcon className="h-5 w-5" />
              ) : (
                <Squares2X2Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          data-main-scroll
          className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
        {filteredFolders.length > 0 ? (
          view === 'grid' ? (
            isDragMode ? (
              <SortableContext
                items={filteredFolders.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredFolders.map((folder) => (
                    <SortableFolderItem
                      key={folder.id}
                      folder={folder}
                      songCount={getSongCount(folder.id)}
                      onFolderClick={handleFolderClick}
                      isDragMode={isDragMode}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredFolders.map((folder) => (
                  <SortableFolderItem
                    key={folder.id}
                    folder={folder}
                    songCount={getSongCount(folder.id)}
                    onFolderClick={handleFolderClick}
                    isDragMode={isDragMode}
                  />
                ))}
              </div>
            )
          ) : isDragMode ? (
            <SortableContext
              items={filteredFolders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {filteredFolders.map((folder) => (
                  <FolderListRow
                    key={folder.id}
                    folder={folder}
                    songCount={getSongCount(folder.id)}
                    onFolderClick={handleFolderClick}
                    isDragMode={isDragMode}
                  />
                ))}
              </ul>
            </SortableContext>
          ) : (
            <ul>
              {filteredFolders.map((folder) => (
                <FolderListRow
                  key={folder.id}
                  folder={folder}
                  songCount={getSongCount(folder.id)}
                  onFolderClick={handleFolderClick}
                  isDragMode={isDragMode}
                />
              ))}
            </ul>
          )
        ) : folders.length > 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('folders.noFoldersFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('folders.noFoldersMatch')}
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('folders.noFolders')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('folders.startCreating')}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedFolder ? (
          <div className="bg-background/95 rounded-lg p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-12 shrink-0">
                <FolderCover
                  imageUrl={draggedFolder.imageUrl}
                  songCount={getSongCount(draggedFolder.id)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{draggedFolder.name}</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

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

      {/* Filter Sheet - bottom sheet like songs page */}
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
              <Label htmlFor="sort-by" className="text-[11px] font-medium text-muted-foreground block">
                {t('folders.sortBy')}
              </Label>
              <Select
                value={draftSortBy}
                onValueChange={(value: 'name' | 'createdAt' | 'songCount') => setDraftSortBy(value)}
              >
                <SelectTrigger
                  id="sort-by"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue placeholder={t('folders.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('sidebar.folderName')}</SelectItem>
                  <SelectItem value="createdAt">{t('songs.createdAt')}</SelectItem>
                  <SelectItem value="songCount">{t('folders.songCount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 py-1">
              <Label htmlFor="sort-direction" className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.sortOrder')}
              </Label>
              <Select
                value={draftSortDirection}
                onValueChange={(value: 'asc' | 'desc') => setDraftSortDirection(value)}
              >
                <SelectTrigger
                  id="sort-direction"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue placeholder={t('songs.sortOrder')} />
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
