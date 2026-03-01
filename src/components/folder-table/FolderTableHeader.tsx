'use client'

import { useLanguage } from '@/context/LanguageContext'

interface FolderTableHeaderProps {
  sortedFoldersCount: number
  selectedCount: number
  searchQuery: string
  showDeleteAll: boolean
  onCancelSelection: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
}

export default function FolderTableHeader({
  sortedFoldersCount,
  selectedCount,
  searchQuery,
  showDeleteAll,
  onCancelSelection,
  onDeleteSelected,
  onDeleteAll
}: FolderTableHeaderProps) {
  const { t } = useLanguage()
  return (
    <>
      {selectedCount > 0 ? (
        <BulkActions
          t={t}
          selectedCount={selectedCount}
          showDeleteAll={showDeleteAll}
          onCancelSelection={onCancelSelection}
          onDeleteSelected={onDeleteSelected}
          onDeleteAll={onDeleteAll}
        />
      ) : (
        <FolderCountDisplay
          t={t}
          count={sortedFoldersCount}
          searchQuery={searchQuery}
        />
      )}
    </>
  )
}

function BulkActions({ t, selectedCount, showDeleteAll, onCancelSelection, onDeleteSelected, onDeleteAll }: { t: (key: string) => string; selectedCount: number; showDeleteAll: boolean; onCancelSelection: () => void; onDeleteSelected: () => void; onDeleteAll: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {selectedCount} {selectedCount === 1 ? t('folders.folderSelected') : t('folders.foldersSelected')}
      </span>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onDeleteSelected}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-lg text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
        >
          {t('folders.deleteSelection')}
        </button>
        {showDeleteAll && (
          <button
            onClick={onDeleteAll}
            className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-lg text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
          >
            {t('folders.deleteAll')}
          </button>
        )}
        <button
          onClick={onCancelSelection}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[48px] sm:min-h-0"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

function FolderCountDisplay({ t, count, searchQuery }: { t: (key: string) => string; count: number; searchQuery: string }) {
  return (
    <div className="flex items-center space-x-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {count} {count === 1 ? t('folders.folderSingular') : t('folders.folderPlural')}
      </span>
      {searchQuery && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          &ldquo;{searchQuery}&rdquo;
        </span>
      )}
    </div>
  )
}







