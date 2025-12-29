'use client'

import { CheckIcon } from '@heroicons/react/24/outline'

interface SongTableHeaderProps {
  sortedSongsCount: number
  selectedCount: number
  currentFolder: string | null
  searchQuery: string
  getFolderName: (folderId: string | null | undefined) => string
  showDeleteAll: boolean
  onCancelSelection: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
  onMoveToFolder?: () => void
  isSelectMode: boolean
  onToggleSelectMode: () => void
  t: (key: string) => string
}

export default function SongTableHeader({
  sortedSongsCount,
  selectedCount,
  currentFolder,
  searchQuery,
  getFolderName,
  showDeleteAll,
  onCancelSelection,
  onDeleteSelected,
  onDeleteAll,
  onMoveToFolder,
  isSelectMode,
  onToggleSelectMode,
  t
}: SongTableHeaderProps) {
  return (
    <>
      {selectedCount > 0 ? (
        <BulkActions 
          selectedCount={selectedCount}
          showDeleteAll={showDeleteAll}
          onCancelSelection={onCancelSelection}
          onDeleteSelected={onDeleteSelected}
          onDeleteAll={onDeleteAll}
          onMoveToFolder={onMoveToFolder}
          t={t}
        />
      ) : (
        <SongCountDisplay
          count={sortedSongsCount}
          currentFolder={currentFolder}
          searchQuery={searchQuery}
          getFolderName={getFolderName}
          isSelectMode={isSelectMode}
          onToggleSelectMode={onToggleSelectMode}
          t={t}
        />
      )}
    </>
  )
}

function BulkActions({ selectedCount, showDeleteAll, onCancelSelection, onDeleteSelected, onDeleteAll, onMoveToFolder, t }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} {selectedCount !== 1 ? t('songs.songCountPlural') : t('songs.songCount')} {t('songs.selected')}
      </span>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {onMoveToFolder && (
          <button
            onClick={onMoveToFolder}
            className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[48px] sm:min-h-0"
          >
            <span className="sm:hidden">Déplacer vers...</span>
            <span className="hidden sm:inline">Déplacer vers...</span>
          </button>
        )}
        <button
          onClick={onDeleteSelected}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
        >
          <span className="sm:hidden">Supprimer sélection</span>
          <span className="hidden sm:inline">{t('songs.deleteSelected')}</span>
        </button>
        {showDeleteAll && (
          <button
            onClick={onDeleteAll}
            className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
          >
            <span className="sm:hidden">Tout supprimer</span>
            <span className="hidden sm:inline">{t('songs.deleteAll')}</span>
          </button>
        )}
        <button
          onClick={onCancelSelection}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[48px] sm:min-h-0"
        >
          <span className="sm:hidden">Annuler</span>
          <span className="hidden sm:inline">{t('songs.cancel')}</span>
        </button>
      </div>
    </div>
  )
}

function SongCountDisplay({ count, currentFolder, searchQuery, getFolderName, isSelectMode, onToggleSelectMode, t }: any) {
  return (
    <div className="flex items-center space-x-2 flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-700">
        {count} {count !== 1 ? t('songs.songCountPlural') : t('songs.songCount')}
      </span>
      {currentFolder && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {currentFolder === 'unorganized' ? 'Sans dossier' : getFolderName(currentFolder)}
        </span>
      )}
      {searchQuery && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          &ldquo;{searchQuery}&rdquo;
        </span>
      )}
      <button
        onClick={onToggleSelectMode}
        className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
          isSelectMode
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        title={isSelectMode ? 'Exit Select Mode' : 'Enter Select Mode'}
      >
        {isSelectMode ? (
          <div className="h-5 w-5 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
            <CheckIcon className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="h-5 w-5 border-2 border-gray-400 rounded" />
        )}
        <span className="ml-2 hidden sm:inline">
          {isSelectMode ? 'Select Mode' : 'Select'}
        </span>
      </button>
    </div>
  )
}

