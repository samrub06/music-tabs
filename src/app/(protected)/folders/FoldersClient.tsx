'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FolderIcon, FolderOpenIcon, PlusIcon, MusicalNoteIcon, Squares2X2Icon, TableCellsIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { Folder } from '@/types'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateFolderOrderAction } from './actions'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import Snackbar from '@/components/Snackbar'

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
  const [folders, setFolders] = useState(initialFolders)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragMode, setIsDragMode] = useState(false)

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
      setError('Erreur lors de la réorganisation. Veuillez réessayer.')
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
        setError('Erreur lors de la création du dossier. Veuillez réessayer.')
      }
    }
  }

  const getSongCount = (folderId: string) => {
    return folderSongCounts.get(folderId) || 0
  }

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders
    }
    const query = searchQuery.toLowerCase().trim()
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(query)
    )
  }, [folders, searchQuery])

  return (
    <DndContext
      sensors={activeSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        {/* Search Bar - First, full width */}
        <div className="mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-7 sm:pl-10 pr-7 sm:pr-10 py-1.5 sm:py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
                type="button"
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Add Folder Button, View Toggle, and Drag Mode Toggle - Second row */}
        <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
          {!showAddForm ? (
            <>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center flex-1 sm:flex-initial px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nouveau dossier</span>
              </button>
              {/* View Toggle */}
              <div className="inline-flex rounded-md shadow-sm border overflow-hidden flex-shrink-0">
                <button
                  className={`px-2 sm:px-2.5 py-1.5 sm:py-1.5 text-sm flex items-center justify-center ${view === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setView('grid')}
                  title="Grid View"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  className={`px-2 sm:px-2.5 py-1.5 sm:py-1.5 text-sm flex items-center justify-center border-l ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setView('table')}
                  title="Table View"
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
              </div>
              {/* Drag Mode Toggle */}
              <button
                onClick={() => setIsDragMode(!isDragMode)}
                className={`inline-flex items-center justify-center px-2 sm:px-2.5 py-1.5 sm:py-1.5 text-sm rounded-md border transition-colors flex-shrink-0 ${
                  isDragMode
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title={isDragMode ? 'Disable Drag & Drop' : 'Enable Drag & Drop'}
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Nom du dossier"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddFolder()
                  if (e.key === 'Escape') {
                    setShowAddForm(false)
                    setNewFolderName('')
                  }
                }}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleAddFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewFolderName('')
                }}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
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
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chansons</th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date de création</th>
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
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chansons</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date de création</th>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dossier trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun dossier ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dossier</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer un nouveau dossier.
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
    </DndContext>
  )
}
