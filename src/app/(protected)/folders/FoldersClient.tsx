'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import { FolderIcon, FolderOpenIcon, PlusIcon, MusicalNoteIcon, Squares2X2Icon, TableCellsIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, ArrowsUpDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
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

function SortableFolderTableRow({ folder, songCount, onFolderClick, isDragMode }: SortableFolderTableRowProps) {
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
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onFolderClick(folder.id)}
    >
      {isDragMode && (
        <td className="px-2 sm:px-3 py-2 whitespace-nowrap w-8">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded inline-flex"
            onClick={(e) => e.stopPropagation()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-400" />
          </div>
        </td>
      )}
      <td className="px-2 sm:px-3 py-2">
        <div>
          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {folder.name}
          </div>
          {/* Tags - can be added later when folder.tags is available */}
          {/* {folder.tags && folder.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {folder.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          )} */}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          <MusicalNoteIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-500">{songCount}</span>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('fr-FR') : '-'}
      </td>
    </tr>
  )
}

function SortableFolderItem({ folder, songCount, onFolderClick, isDragMode }: SortableFolderItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onFolderClick(folder.id)}
    >
      <div className="p-2 sm:p-3">
        <div className="flex items-center space-x-2">
            {isDragMode && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Bars3Icon className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {folder.name}
              </h3>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
              <div className="flex items-center space-x-1.5">
                <MusicalNoteIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">{songCount}</span>
              </div>
              {/* Tags - can be added later when folder.tags is available */}
              {/* {folder.tags && folder.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {folder.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )} */}
            </div>
          </div>
        </div>
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
    setIsFilterSheetOpen(false)
  }
  
  const handleClearFilters = () => {
    setSortBy('name')
    setSortDirection('asc')
    setIsFilterSheetOpen(false)
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
              onClick={() => setIsFilterSheetOpen(true)}
              className={cn(
                'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
                isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
              )}
              aria-label={t('folders.filters')}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 max-lg:shrink-0" />
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
              <SortableContext items={filteredFolders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
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
          ) : (
            isDragMode ? (
              <SortableContext items={filteredFolders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sidebar.folderName')}</th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('folders.songs')}</th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('songs.createdAt')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFolders.map((folder) => (
                        <SortableFolderTableRow
                          key={folder.id}
                          folder={folder}
                          songCount={getSongCount(folder.id)}
                          onFolderClick={handleFolderClick}
                          isDragMode={isDragMode}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sidebar.folderName')}</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('folders.songs')}</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('songs.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFolders.map((folder) => (
                      <SortableFolderTableRow
                        key={folder.id}
                        folder={folder}
                        songCount={getSongCount(folder.id)}
                        onFolderClick={handleFolderClick}
                        isDragMode={isDragMode}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
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
          <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-3 max-w-[200px]">
            <div className="flex items-center space-x-2">
              <FolderIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{draggedFolder.name}</div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <MusicalNoteIcon className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{getSongCount(draggedFolder.id)}</span>
                </div>
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
          className="flex h-[85vh] max-h-[640px] flex-col rounded-t-[1.75rem] border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden"
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
            <SheetTitle className="text-xl font-semibold">{t('folders.filters')}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4 px-1">
            {/* Sort By - card style */}
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="sort-by" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('folders.sortBy')}
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'createdAt' | 'songCount') => setSortBy(value)}
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

            {/* Sort Direction - card style */}
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="sort-direction" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortOrder')}
              </Label>
              <Select
                value={sortDirection}
                onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}
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

          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-background safe-area-inset-bottom">
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
