'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

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
  const { t } = useLanguage()
  const title =
    currentFolder === 'unorganized'
      ? t('songs.emptyUnorganized')
      : currentFolder
        ? t('songs.emptyInFolder').replace('{name}', getFolderName(currentFolder))
        : searchQuery
          ? t('songs.emptyNoResults')
          : t('songs.emptyNoSongs')
  const description =
    currentFolder === 'unorganized'
      ? t('songs.emptyDescUnorganized')
      : currentFolder
        ? t('songs.emptyDescInFolder')
        : searchQuery
          ? t('songs.emptyDescNoResults')
          : t('songs.emptyDescNoSongs')
  return (
    <tr>
      <td colSpan={hasUser ? visibleColumnsCount + 2 : visibleColumnsCount + 1} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
          {(currentFolder || searchQuery) && (
            <button
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 transition-colors"
            >
              {t('songs.viewAllSongs')}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

