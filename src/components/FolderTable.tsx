'use client'

import { Folder } from '@/types'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import React, { useMemo, useState } from 'react'
import FolderTableHeader from './folder-table/FolderTableHeader'
import FolderTableRow from './folder-table/FolderTableRow'
import FolderTableEmptyState from './folder-table/FolderTableEmptyState'

type SortField = 'name' | 'songCount' | 'createdAt' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

interface FolderTableProps {
  folders: Folder[]
  songCountByFolder: Record<string, number>
  searchQuery?: string
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDeleteMultiple: (ids: string[]) => Promise<void>
}

export default function FolderTable({
  folders,
  songCountByFolder,
  searchQuery = '',
  onRename,
  onDelete,
  onDeleteMultiple
}: FolderTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)

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

  // Sort folders
  const sortedFolders = useMemo(() => {
    return [...filteredFolders].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'songCount':
          aValue = songCountByFolder[a.id] || 0
          bValue = songCountByFolder[b.id] || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredFolders, sortField, sortDirection, songCountByFolder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  )

  // Handle folder selection
  const handleSelectFolder = (folderId: string, checked: boolean) => {
    const newSelectedFolders = new Set(selectedFolders)
    if (checked) {
      newSelectedFolders.add(folderId)
    } else {
      newSelectedFolders.delete(folderId)
    }
    setSelectedFolders(newSelectedFolders)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFolderIds = new Set(sortedFolders.map(folder => folder.id))
      setSelectedFolders(allFolderIds)
    } else {
      setSelectedFolders(new Set())
    }
  }

  // Handle bulk delete
  const handleBulkDelete = (type: 'selected' | 'all') => {
    setDeleteType(type)
    setShowDeleteConfirm(true)
  }

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    try {
      if (deleteType === 'all') {
        await onDeleteMultiple(sortedFolders.map(f => f.id))
      } else if (deleteType === 'selected') {
        await onDeleteMultiple(Array.from(selectedFolders))
      }
      setSelectedFolders(new Set())
    } catch (error) {
      console.error('Error deleting folders:', error)
    } finally {
      setShowDeleteConfirm(false)
      setDeleteType(null)
    }
  }

  // Cancel bulk delete
  const cancelBulkDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteType(null)
  }

  const showEmptyState = sortedFolders.length === 0

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Filter Bar */}
      <div className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <FolderTableHeader
            sortedFoldersCount={sortedFolders.length}
            selectedCount={selectedFolders.size}
            searchQuery={searchQuery}
            showDeleteAll={selectedFolders.size === sortedFolders.length && sortedFolders.length > 0}
            onCancelSelection={() => setSelectedFolders(new Set())}
            onDeleteSelected={() => handleBulkDelete('selected')}
            onDeleteAll={() => handleBulkDelete('all')}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {/* Checkbox column */}
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12 sm:w-12">
                <input
                  type="checkbox"
                  checked={selectedFolders.size === sortedFolders.length && sortedFolders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
              </th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="name">Nom</SortButton>
              </th>
              <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="songCount">Chansons</SortButton>
              </th>
              <th className="hidden md:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="createdAt">Créé le</SortButton>
              </th>
              <th className="hidden lg:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="updatedAt">Modifié le</SortButton>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {showEmptyState ? (
              <FolderTableEmptyState
                searchQuery={searchQuery}
                onResetFilters={() => {}}
                hasUser={true}
              />
            ) : (
              sortedFolders.map((folder) => (
                <FolderTableRow
                  key={folder.id}
                  folder={folder}
                  songCount={songCountByFolder[folder.id] || 0}
                  isSelected={selectedFolders.has(folder.id)}
                  isEditing={editingFolderId === folder.id}
                  onSelect={(checked) => handleSelectFolder(folder.id, checked)}
                  onRename={onRename}
                  onDelete={onDelete}
                  onStartEdit={setEditingFolderId}
                  onCancelEdit={() => setEditingFolderId(null)}
                  hasUser={true}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 max-w-[90vw] shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                {deleteType === 'all' ? 'Supprimer tous les dossiers ?' : 'Supprimer les dossiers sélectionnés ?'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {deleteType === 'all' 
                    ? 'Cette action supprimera tous les dossiers. Les chansons ne seront pas supprimées, elles seront simplement retirées de leurs dossiers.'
                    : `Cette action supprimera ${selectedFolders.size} ${selectedFolders.size === 1 ? 'dossier' : 'dossiers'}. Les chansons ne seront pas supprimées, elles seront simplement retirées de leurs dossiers.`
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
                <button
                  onClick={cancelBulkDelete}
                  className="px-6 py-3 sm:px-4 sm:py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-lg shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[52px] sm:min-h-0"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-6 py-3 sm:px-4 sm:py-2 bg-red-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[52px] sm:min-h-0"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






