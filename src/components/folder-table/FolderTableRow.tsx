'use client'

import { Folder } from '@/types'
import { FolderIcon, FolderOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

interface FolderTableRowProps {
  folder: Folder
  songCount: number
  isSelected: boolean
  isEditing: boolean
  onSelect: (checked: boolean) => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
  hasUser: boolean
}

export default function FolderTableRow({
  folder,
  songCount,
  isSelected,
  isEditing,
  onSelect,
  onRename,
  onDelete,
  onStartEdit,
  onCancelEdit,
  hasUser
}: FolderTableRowProps) {
  const router = useRouter()
  const [editName, setEditName] = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditName(folder.name)
  }, [folder.name])

  const handleFolderClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox, edit button, or delete button
    if ((e.target as HTMLElement).closest('input[type="checkbox"]') ||
        (e.target as HTMLElement).closest('button')) {
      return
    }
    // Navigate to dashboard - user can filter by folder in the sidebar
    router.push('/dashboard')
  }

  const handleRename = async () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      await onRename(folder.id, editName.trim())
    }
    onCancelEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditName(folder.name)
      onCancelEdit()
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <tr
      onClick={handleFolderClick}
      className="group hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    >
      {/* Checkbox column */}
      {hasUser && (
        <td 
          className="px-2 sm:px-4 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
        </td>
      )}
      
      {/* Name column */}
      <td className="px-2 sm:px-4 py-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FolderIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-1 text-sm border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">{folder.name}</span>
              {hasUser && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartEdit(folder.id)
                    }}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                    title="Renommer"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${folder.name}" ? Les chansons dans ce dossier ne seront pas supprimées.`)) {
                        onDelete(folder.id)
                      }
                    }}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Song count column */}
      <td className="hidden sm:table-cell px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        {songCount} {songCount === 1 ? 'chanson' : 'chansons'}
      </td>

      {/* Created date column */}
      <td className="hidden md:table-cell px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        {formatDate(folder.createdAt)}
      </td>

      {/* Updated date column */}
      <td className="hidden lg:table-cell px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        {formatDate(folder.updatedAt)}
      </td>
    </tr>
  )
}

