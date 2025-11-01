'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/outline'

interface SongTableEmptyStateProps {
  currentFolder: string | null | undefined
  searchQuery: string
  getFolderName: (folderId: string | null | undefined) => string
  onResetFilters: () => void
  visibleColumnsCount: number
  hasUser: boolean
}

export default function SongTableEmptyState({
  currentFolder,
  searchQuery,
  getFolderName,
  onResetFilters,
  visibleColumnsCount,
  hasUser
}: SongTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={hasUser ? visibleColumnsCount + 2 : visibleColumnsCount + 1} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {currentFolder === 'unorganized' 
              ? 'Aucune chanson sans dossier'
              : currentFolder 
              ? `Aucune chanson dans "${getFolderName(currentFolder)}"`
              : searchQuery 
              ? 'Aucune chanson trouvée'
              : 'Aucune chanson'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {currentFolder === 'unorganized' 
              ? 'Toutes vos chansons sont organisées dans des dossiers'
              : currentFolder 
              ? 'Essayez de sélectionner un autre dossier ou ajoutez des chansons à ce dossier'
              : searchQuery 
              ? 'Essayez avec d\'autres mots-clés'
              : 'Commencez par ajouter votre première chanson'
            }
          </p>
          {(currentFolder || searchQuery) && (
            <button
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Voir toutes les chansons
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

