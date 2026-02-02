'use client'

import { Folder } from '@/types'
import { useLanguage } from '@/context/LanguageContext'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

interface FolderSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  folders: Folder[]
  selectedFolderId: string | undefined
  onSelectFolder: (folderId: string | undefined) => void
}

export default function FolderSelectionModal({
  isOpen,
  onClose,
  folders,
  selectedFolderId,
  onSelectFolder,
}: FolderSelectionModalProps) {
  const { t } = useLanguage();
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (folderId: string | undefined) => {
    onSelectFolder(folderId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-lg shadow-lg max-h-[80vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('songs.folder')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={t('common.close')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {/* All Folders Option */}
          <button
            onClick={() => handleSelect(undefined)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors mb-2 ${
              selectedFolderId === undefined
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">{t('songs.allFolders')}</span>
            {selectedFolderId === undefined && (
              <CheckIcon className="h-5 w-5 text-blue-600" />
            )}
          </button>

          {/* Folder List */}
          {folders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">{t('folders.noFolders')}</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleSelect(folder.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{folder.name}</span>
                {selectedFolderId === folder.id && (
                  <CheckIcon className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

