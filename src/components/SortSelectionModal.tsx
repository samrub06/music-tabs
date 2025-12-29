'use client'

import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

export type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt' | 'key' | 'rating' | 'reviews' | 'difficulty' | 'version' | 'viewCount'
export type SortDirection = 'asc' | 'desc'

interface SortOption {
  field: SortField
  label: string
  icon: string
}

const sortOptions: SortOption[] = [
  { field: 'title', label: 'Titre', icon: '📝' },
  { field: 'author', label: 'Artiste', icon: '👤' },
  { field: 'key', label: 'Tonalité', icon: '🎵' },
  { field: 'rating', label: 'Note', icon: '⭐' },
  { field: 'reviews', label: 'Avis', icon: '👥' },
  { field: 'difficulty', label: 'Difficulté', icon: '🎸' },
  { field: 'version', label: 'Version', icon: '🔢' },
  { field: 'viewCount', label: 'Vues', icon: '👁️' },
  { field: 'updatedAt', label: 'Modifié', icon: '📅' },
]

interface SortSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSortField: SortField
  selectedSortDirection: SortDirection
  onSelectSort: (field: SortField, direction: SortDirection) => void
}

export default function SortSelectionModal({
  isOpen,
  onClose,
  selectedSortField,
  selectedSortDirection,
  onSelectSort,
}: SortSelectionModalProps) {
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

  const handleSelect = (field: SortField) => {
    // If clicking the same field, toggle direction; otherwise set to asc
    const newDirection = field === selectedSortField && selectedSortDirection === 'asc' ? 'desc' : 'asc'
    onSelectSort(field, newDirection)
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
          <h2 className="text-lg font-semibold text-gray-900">Trier par</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Sort Options List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {sortOptions.map((option) => {
            const isSelected = selectedSortField === option.field
            return (
              <button
                key={option.field}
                onClick={() => handleSelect(option.field)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600">
                      {selectedSortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                    <CheckIcon className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
