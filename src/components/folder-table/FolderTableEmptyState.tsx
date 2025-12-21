'use client'

import { FolderIcon } from '@heroicons/react/24/outline'

interface FolderTableEmptyStateProps {
  searchQuery: string
  onResetFilters: () => void
  hasUser: boolean
}

export default function FolderTableEmptyState({
  searchQuery,
  onResetFilters,
  hasUser
}: FolderTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={hasUser ? 5 : 4} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery 
              ? 'Aucun dossier trouvé'
              : 'Aucun dossier'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'Essayez avec d\'autres mots-clés'
              : 'Commencez par créer votre premier dossier'
            }
          </p>
          {searchQuery && (
            <button
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Voir tous les dossiers
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

