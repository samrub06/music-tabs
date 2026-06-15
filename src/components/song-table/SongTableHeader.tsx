'use client'

import {
  EllipsisHorizontalIcon,
  FolderIcon,
  TrashIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function SongBulkActions({
  showDeleteAll,
  onCancelSelection,
  onDeleteSelected,
  onDeleteAll,
  onMoveToFolder,
  onCreatePlaylist,
  t,
}: {
  showDeleteAll: boolean
  onCancelSelection: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
  onMoveToFolder?: () => void
  onCreatePlaylist?: () => void
  t: (key: string) => string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {onMoveToFolder && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onMoveToFolder}
          className="h-8 w-8"
          aria-label={t('songs.moveToFolder')}
          title={t('songs.moveToFolder')}
        >
          <FolderIcon className="h-4 w-4" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={t('songs.moreActions')}
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {onCreatePlaylist && (
            <DropdownMenuItem onClick={onCreatePlaylist}>
              <SparklesIcon className="h-4 w-4" />
              {t('songs.createPlaylist')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDeleteSelected}
            className="text-destructive focus:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
            {t('songs.deleteSelected')}
          </DropdownMenuItem>
          {showDeleteAll && (
            <DropdownMenuItem
              onClick={onDeleteAll}
              className="text-destructive focus:text-destructive"
            >
              <TrashIcon className="h-4 w-4" />
              {t('songs.deleteAll')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCancelSelection}>
            {t('songs.clearSelection')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function BulkActions(props: Parameters<typeof SongBulkActions>[0] & { selectedCount: number }) {
  const { selectedCount: _selectedCount, ...rest } = props
  return <SongBulkActions {...rest} />
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
        'flex h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium transition-all duration-200 sm:gap-2 sm:px-4',
        isSelectMode
          ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      aria-pressed={isSelectMode}
      title={isSelectMode ? t('songs.exitSelectMode') : t('songs.select')}
    >
      {isSelectMode ? (
        <XMarkIcon className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-current"
          aria-hidden
        />
      )}
      <span>{isSelectMode ? t('songs.selectModeOn') : t('songs.select')}</span>
    </button>
  )
}
