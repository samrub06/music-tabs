'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import { FolderIcon, PlusIcon, Squares2X2Icon, TableCellsIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, ArrowsUpDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { Folder } from '@/types'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateFolderOrderAction } from './actions'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  const songCountLabel =
    songCount === 1 ? `1 ${t('songs.songCount')}` : `${songCount} ${t('songs.songCountPlural')}`

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FolderIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{folder.name}</p>
          <p className="text-xs text-muted-foreground">{songCountLabel}</p>
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

  const songCountLabel =
    songCount === 1 ? `1 ${t('songs.songCount')}` : `${songCount} ${t('songs.songCountPlural')}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group flex min-w-0 cursor-pointer flex-col gap-1.5', isDragging && 'opacity-50')}
      onClick={() => onFolderClick(folder.id)}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-primary/10">
        <div className="flex h-full w-full items-center justify-center">
          <FolderIcon className="h-8 w-8 text-primary/80 sm:h-9 sm:w-9" />
        </div>
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
        <p className="truncate text-[10px] text-muted-foreground">{songCountLabel}</p>
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
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchValue, setLocalSearchValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'songCount'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [draftSortBy, setDraftSortBy] = useState<'name' | 'createdAt' | 'songCount'>('name')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('asc')

  const hasActiveFilters = sortBy !== 'name' || sortDirection !== 'asc'

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
    router.push(`/folders/${folderId}`)
  }

  const handleAddFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await addFolderAction(newFolderName.trim())
        setNewFolderName('')
        setIsAddSheetOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error adding folder:', error)
        setError(t('folders.createError'))
      }
    }
  }

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false)
    setNewFolderName('')
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
    
    // Apply sorting
    filtered.sort((a, b) => {
      let compareA: any, compareB: any
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
      
      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return sortDirection === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA)
      } else {
        return sortDirection === 'asc' ? compareA - compareB : compareB - compareA
      }
    })
    
    return filtered
  }, [folders, searchQuery, sortBy, sortDirection, getSongCount])
  
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
    setDraftSortBy('name')
    setDraftSortDirection('asc')
    setSortBy('name')
    setSortDirection('asc')
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
              onClick={() => setIsDragMode(!isDragMode)}
              className={cn(
                'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-3 transition-all duration-200',
                isDragMode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
              )}
              title={isDragMode ? t('folders.disableDrag') : t('folders.enableDrag')}
              aria-label={isDragMode ? t('folders.disableDrag') : t('folders.enableDrag')}
            >
              <ArrowsUpDownIcon className="h-5 w-5 max-lg:shrink-0" />
            </button>
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
              onClick={() => setIsAddSheetOpen(true)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t('folders.newFolder')}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
                  view === 'grid'
                    ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={t('folders.gridView')}
              >
                <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t('folders.gridView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn(
                  'flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
                  view === 'table'
                    ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={t('folders.tableView')}
              >
                <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t('folders.tableView')}</span>
              </button>
            </div>
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
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{draggedFolder.name}</div>
                <div className="text-xs text-muted-foreground">{getSongCount(draggedFolder.id)}</div>
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

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4 px-1">
            <div className="space-y-2.5 py-1">
              <Label htmlFor="sort-by" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('folders.sortBy')}
              </Label>
              <Select
                value={draftSortBy}
                onValueChange={(value: 'name' | 'createdAt' | 'songCount') => setDraftSortBy(value)}
              >
                <SelectTrigger id="sort-by" className="h-10 rounded-xl">
                  <SelectValue placeholder={t('folders.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('sidebar.folderName')}</SelectItem>
                  <SelectItem value="createdAt">{t('songs.createdAt')}</SelectItem>
                  <SelectItem value="songCount">{t('folders.songCount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5 py-1">
              <Label htmlFor="sort-direction" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortOrder')}
              </Label>
              <Select
                value={draftSortDirection}
                onValueChange={(value: 'asc' | 'desc') => setDraftSortDirection(value)}
              >
                <SelectTrigger id="sort-direction" className="h-10 rounded-xl">
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

      {/* New folder bottom sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={(open) => !open && handleCloseAddSheet()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-auto max-h-[50vh] flex-col rounded-t-[1.75rem] border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden"
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
            <SheetTitle className="text-xl font-semibold">{t('folders.newFolder')}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-4">
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="new-folder-name" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('sidebar.folderName')}
              </Label>
              <Input
                id="new-folder-name"
                type="text"
                placeholder={t('folders.folderNamePlaceholder')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder()
                  if (e.key === 'Escape') handleCloseAddSheet()
                }}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>
          </div>

          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-background safe-area-inset-bottom">
            <Button
              variant="outline"
              onClick={handleCloseAddSheet}
              className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddFolder}
              disabled={!newFolderName.trim()}
              className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
            >
              {t('common.create')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}
