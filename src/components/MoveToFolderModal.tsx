'use client'

import { Folder } from '@/types'
import { FolderIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface MoveToFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folders: Folder[]
  onMove: (folderId: string | undefined) => Promise<void>
  songCount: number
}

export default function MoveToFolderModal({
  isOpen,
  onClose,
  folders,
  onMove,
  songCount
}: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined)
  const [isMoving, setIsMoving] = useState(false)

  if (!isOpen) return null

  const handleMove = async () => {
    setIsMoving(true)
    try {
      await onMove(selectedFolderId)
      onClose()
      setSelectedFolderId(undefined)
    } catch (error) {
      console.error('Error moving songs:', error)
      // Error will be handled by parent component
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 max-w-[90vw] shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Déplacer {songCount} {songCount === 1 ? 'chanson' : 'chansons'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isMoving}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Sélectionnez un dossier de destination :
          </p>
          
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            <button
              onClick={() => setSelectedFolderId(undefined)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                selectedFolderId === undefined
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <FolderIcon className="h-4 w-4 mr-3" />
              Sans dossier
            </button>
            
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                  selectedFolderId === folder.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <FolderIcon className="h-4 w-4 mr-3" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="px-6 py-3 sm:px-4 sm:py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-lg shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[52px] sm:min-h-0 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving}
            className="px-6 py-3 sm:px-4 sm:py-2 bg-blue-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[52px] sm:min-h-0 disabled:opacity-50"
          >
            {isMoving ? 'Déplacement...' : 'Déplacer'}
          </button>
        </div>
      </div>
    </div>
  )
}

