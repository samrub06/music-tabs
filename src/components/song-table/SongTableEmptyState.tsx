'use client'

import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

interface SongTableEmptyStateProps {
  currentFolder: string | null | undefined
  searchQuery: string
  getFolderName: (folderId: string | null | undefined) => string
  onResetFilters: () => void
}

export default function SongTableEmptyState({
  currentFolder,
  searchQuery,
  getFolderName,
  onResetFilters,
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
    <li className="px-6 py-12 text-center">
      <div className="flex flex-col items-center">
        <MusicalNoteIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {(currentFolder || searchQuery) && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200"
          >
            {t('songs.viewAllSongs')}
          </button>
        )}
      </div>
    </li>
  )
}
