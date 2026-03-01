'use client'

import { FolderIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

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
  const { t } = useLanguage()
  return (
    <tr>
      <td colSpan={hasUser ? 5 : 4} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {searchQuery ? t('folders.noResults') : t('folders.noFoldersEmpty')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? t('folders.tryOtherKeywords') : t('folders.startByCreating')}
          </p>
          {searchQuery && (
            <button
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 transition-colors"
            >
              {t('folders.viewAllFolders')}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}







