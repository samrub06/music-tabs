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
  const countLabel =
    selectedCount === 1
      ? `1 ${t('songs.songCount')} ${t('songs.selected')}`
      : `${selectedCount} ${t('songs.songCountPlural')} ${t('songs.selected')}`

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{countLabel}</p>
      <div className="flex flex-wrap gap-2">
        {onMoveToFolder && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveToFolder}
            className="min-h-10 gap-1.5"
          >
            <FolderIcon className="h-4 w-4" />
            {t('songs.moveToFolder')}
          </Button>
        )}
        {onCreatePlaylist && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreatePlaylist}
            className="min-h-10 gap-1.5"
          >
            <SparklesIcon className="h-4 w-4" />
            {t('songs.createPlaylist')}
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          className="min-h-10 gap-1.5"
        >
          <TrashIcon className="h-4 w-4" />
          {t('songs.deleteSelected')}
        </Button>
        {showDeleteAll && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDeleteAll}
            className="min-h-10 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {t('songs.deleteAll')}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancelSelection}
          className="min-h-10"
        >
          {t('songs.clearSelection')}
        </Button>
      </div>
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
