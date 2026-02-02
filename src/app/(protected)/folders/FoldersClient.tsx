'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { FolderIcon, FolderOpenIcon, PlusIcon, MusicalNoteIcon, Squares2X2Icon, TableCellsIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, ArrowsUpDownIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { Folder } from '@/types'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateFolderOrderAction } from './actions'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
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
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
  
  const [folders, setFolders] = useState(initialFolders)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchValue, setLocalSearchValue] = useState('')
  const [isDragMode, setIsDragMode] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
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
        setShowAddForm(false)
        // Refresh the page to get updated folders list
        router.refresh()
      } catch (error) {
        console.error('Error adding folder:', error)
        setError(t('folders.createError'))
      }
    }
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
    if (isSearchExpanded) {
      setIsSearchExpanded(false)
    }
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
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen">
        {/* Header with Search, Filter, View Toggle, and Actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Mobile Search Icon / Expanded Search */}
          <div className="flex-1 lg:hidden">
            {!isSearchExpanded ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsSearchExpanded(true)
                  searchInputRef.current?.focus()
                }}
                className="h-10 w-10"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </Button>
            ) : (
              <div className="relative flex items-center w-full">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('folders.searchPlaceholder')}
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5"
                />
                {localSearchValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSearch}
                    className="absolute right-0 h-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchExpanded(false)}
                  className="absolute right-10 h-full lg:hidden"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 relative">
            <Input
              type="text"
              placeholder={t('folders.searchPlaceholder')}
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {localSearchValue && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                className="absolute right-0 h-full"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* View Toggle - Desktop only */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="inline-flex rounded-md shadow-sm border overflow-hidden">
              <button
                className={`px-3 py-2 text-sm flex items-center justify-center ${view === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setView('grid')}
                title="Grid View"
              >
                <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                className={`px-3 py-2 text-sm flex items-center justify-center border-l ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setView('table')}
                title="Table View"
              >
                <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFilterSheetOpen(true)}
            className="h-10 w-10 flex-shrink-0"
          >
            <FunnelIcon className="h-5 w-5" />
          </Button>

          {/* Drag Mode Toggle */}
          <Button
            variant={isDragMode ? 'default' : 'outline'}
            size="icon"
            onClick={() => setIsDragMode(!isDragMode)}
            className="h-10 w-10 flex-shrink-0"
            title={isDragMode ? 'Disable Drag & Drop' : 'Enable Drag & Drop'}
          >
            <ArrowsUpDownIcon className="h-5 w-5" />
          </Button>

          {/* Add Folder Button */}
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              className="h-10"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('folders.newFolder')}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={t('folders.folderNamePlaceholder')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddFolder()
                  if (e.key === 'Escape') {
                    setShowAddForm(false)
                    setNewFolderName('')
                  }
                }}
                className="w-48"
                autoFocus
              />
              <Button
                onClick={handleAddFolder}
                disabled={!newFolderName.trim()}
              >
                {t('common.create')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewFolderName('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>

        {/* Folders Display */}
        {filteredFolders.length > 0 ? (
          view === 'grid' ? (
            isDragMode ? (
              <SortableContext items={filteredFolders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 justify-items-start">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 justify-items-start">
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

      {/* Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('songs.advancedFilters')}</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            {/* Sort By */}
            <div className="grid gap-2">
              <Label htmlFor="sort-by">{t('folders.sortBy')}</Label>
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'createdAt' | 'songCount') => setSortBy(value)}
              >
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder={t('folders.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('sidebar.folderName')}</SelectItem>
                  <SelectItem value="createdAt">{t('songs.createdAt')}</SelectItem>
                  <SelectItem value="songCount">{t('folders.songCount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div className="grid gap-2">
              <Label htmlFor="sort-direction">{t('songs.sortOrder')}</Label>
              <Select
                value={sortDirection}
                onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}
              >
                <SelectTrigger id="sort-direction">
                  <SelectValue placeholder={t('songs.sortOrder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('songs.ascending')}</SelectItem>
                  <SelectItem value="desc">{t('songs.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="flex-row justify-between gap-2 mt-4">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Effacer les filtres
            </Button>
            <Button onClick={handleApplyFilters} className="w-full">
              Appliquer les filtres
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}
