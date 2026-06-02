'use client'

import {
  CheckIcon,
  FolderIcon,
  TrashIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  onCreatePlaylist?: () => void
  isSelectMode: boolean
  onToggleSelectMode: () => void
  onExitSelectMode?: () => void
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
  onCreatePlaylist,
  isSelectMode,
  onToggleSelectMode,
  onExitSelectMode,
  t,
}: SongTableHeaderProps) {
  if (selectedCount > 0) {
    return (
      <BulkActions
        selectedCount={selectedCount}
        showDeleteAll={showDeleteAll}
        onCancelSelection={onCancelSelection}
        onDeleteSelected={onDeleteSelected}
        onDeleteAll={onDeleteAll}
        onMoveToFolder={onMoveToFolder}
        onCreatePlaylist={onCreatePlaylist}
        t={t}
      />
    )
  }

  if (isSelectMode) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t('songs.selectSongsHint')}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExitSelectMode ?? onToggleSelectMode}
          className="min-h-9"
        >
          <XMarkIcon className="mr-1.5 h-4 w-4" />
          {t('songs.done')}
        </Button>
      </div>
    )
  }

  return (
    <SongCountDisplay
      count={sortedSongsCount}
      currentFolder={currentFolder}
      searchQuery={searchQuery}
      getFolderName={getFolderName}
      t={t}
    />
  )
}

function BulkActions({
  selectedCount,
  showDeleteAll,
  onCancelSelection,
  onDeleteSelected,
  onDeleteAll,
  onMoveToFolder,
  onCreatePlaylist,
  t,
}: {
  selectedCount: number
  showDeleteAll: boolean
  onCancelSelection: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
  onMoveToFolder?: () => void
  onCreatePlaylist?: () => void
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {onMoveToFolder && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onMoveToFolder}
          className="h-9 shrink-0 gap-1.5 whitespace-nowrap px-2.5"
        >
          <FolderIcon className="h-4 w-4 shrink-0" />
          {t('songs.moveToFolder')}
        </Button>
      )}
      {onCreatePlaylist && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreatePlaylist}
          className="h-9 shrink-0 gap-1.5 whitespace-nowrap px-2.5"
        >
          <SparklesIcon className="h-4 w-4 shrink-0" />
          {t('songs.createPlaylist')}
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onDeleteSelected}
        className="h-9 w-9 shrink-0 p-0 sm:w-auto sm:gap-1.5 sm:px-2.5"
        aria-label={t('songs.deleteSelected')}
        title={t('songs.deleteSelected')}
      >
        <TrashIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{t('songs.deleteSelected')}</span>
      </Button>
      {showDeleteAll && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDeleteAll}
          className="h-9 w-9 shrink-0 border-destructive/40 p-0 text-destructive hover:bg-destructive/10 sm:w-auto sm:px-2.5"
          aria-label={t('songs.deleteAll')}
          title={t('songs.deleteAll')}
        >
          <TrashIcon className="h-4 w-4 shrink-0 sm:hidden" />
          <span className="hidden sm:inline">{t('songs.deleteAll')}</span>
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancelSelection}
        className="h-9 shrink-0 whitespace-nowrap px-2.5"
      >
        {t('songs.clearSelection')}
      </Button>
    </div>
  )
}

function SongCountDisplay({
  count,
  currentFolder,
  searchQuery,
  getFolderName,
  t,
}: {
  count: number
  currentFolder: string | null
  searchQuery: string
  getFolderName: (folderId: string | null | undefined) => string
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {count} {count !== 1 ? t('songs.songCountPlural') : t('songs.songCount')}
      </span>
      {currentFolder && (
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {currentFolder === 'unorganized' ? t('songs.unorganized') : getFolderName(currentFolder)}
        </span>
      )}
      {searchQuery && (
        <span className="inline-flex items-center rounded-full border border-green-600/20 bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
          &ldquo;{searchQuery}&rdquo;
        </span>
      )}
    </div>
  )
}

export function SelectModeToggleButton({
  isSelectMode,
  onToggle,
  t,
  className,
}: {
  isSelectMode: boolean
  onToggle: () => void
  t: (key: string) => string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
        isSelectMode
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
      aria-pressed={isSelectMode}
    >
      {isSelectMode ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded border-2 border-current" />
      )}
      <span>{isSelectMode ? t('songs.selectModeOn') : t('songs.select')}</span>
    </button>
  )
}
