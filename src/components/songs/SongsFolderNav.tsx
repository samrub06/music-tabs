'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  FolderIcon,
  FolderOpenIcon,
  EllipsisHorizontalIcon,
  MusicalNoteIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { Folder } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilterChip } from '@/components/ui/filter-chip'

export type FolderSongCounts = Record<string, number>

interface SongsFolderNavProps {
  folders: Folder[]
  folderSongCounts: FolderSongCounts
  /** `null` = all songs, `'unorganized'`, or folder id */
  currentFolder: string | null
  onFolderSelect: (folderId: string | undefined) => void
  onCreateFolder?: (name: string) => Promise<void>
  isDragging?: boolean
}

function getCount(counts: FolderSongCounts, folderKey: string): number {
  return counts[folderKey] ?? 0
}

function getTotalSongCount(counts: FolderSongCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}

function isAllActive(currentFolder: string | null): boolean {
  return currentFolder === null
}

function isUnorganizedActive(currentFolder: string | null): boolean {
  return currentFolder === 'unorganized'
}

function DroppableNavItem({
  dropId,
  isActive,
  isDragging,
  onClick,
  children,
  className,
}: {
  dropId: string
  isActive: boolean
  isDragging: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId, disabled: !isDragging })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
        isOver && isDragging
          ? 'scale-[1.02] border-2 border-dashed border-primary bg-primary/15 shadow-sm'
          : isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-muted/80',
        className
      )}
    >
      {children}
    </button>
  )
}

function FolderCountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
      {count}
    </span>
  )
}

function AddFolderInline({
  onCreateFolder,
  compact = false,
}: {
  onCreateFolder?: (name: string) => Promise<void>
  compact?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)

  if (!onCreateFolder) return null

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed || pending) return
    setPending(true)
    try {
      await onCreateFolder(trimmed)
      setName('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to create folder:', error)
    } finally {
      setPending(false)
    }
  }

  if (open) {
    return (
      <div className={cn('flex gap-2', compact ? 'px-1 py-1' : 'px-2 py-2')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('sidebar.folderName')}
          className="h-9 flex-1 rounded-xl text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSubmit()
            if (e.key === 'Escape') {
              setOpen(false)
              setName('')
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-xl px-3"
          disabled={!name.trim() || pending}
          onClick={() => void handleSubmit()}
        >
          {t('sidebar.create')}
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'flex items-center gap-2 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground',
        compact ? 'shrink-0 px-3 py-2' : 'w-full px-3 py-2.5'
      )}
    >
      <PlusIcon className="h-4 w-4 shrink-0" />
      <span className={compact ? 'whitespace-nowrap' : undefined}>{t('sidebar.addFolder')}</span>
    </button>
  )
}

export function SongsFolderSidebar({
  folders,
  folderSongCounts,
  currentFolder,
  onFolderSelect,
  onCreateFolder,
  isDragging = false,
}: SongsFolderNavProps) {
  const { t } = useLanguage()
  const sortedFolders = useMemo(
    () => sortFoldersBySongCount(folders, folderSongCounts),
    [folders, folderSongCounts]
  )
  const totalCount = getTotalSongCount(folderSongCounts)
  const unorganizedCount = getCount(folderSongCounts, 'null')

  return (
    <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col border-r border-border/80 bg-muted/20 overflow-hidden">
      <div className="shrink-0 px-3 pt-4 pb-2">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sidebar.folders')}
        </p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-2 space-y-0.5">
        <DroppableNavItem
          dropId="folder-nav-all"
          isActive={isAllActive(currentFolder)}
          isDragging={false}
          onClick={() => onFolderSelect(undefined)}
        >
          <MusicalNoteIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('sidebar.allSongs')}</span>
          <FolderCountBadge count={totalCount} />
        </DroppableNavItem>

        <DroppableNavItem
          dropId="folder-null"
          isActive={isUnorganizedActive(currentFolder)}
          isDragging={isDragging}
          onClick={() => onFolderSelect('unorganized')}
        >
          <FolderOpenIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('sidebar.unorganizedSongs')}</span>
          <FolderCountBadge count={unorganizedCount} />
        </DroppableNavItem>

        {sortedFolders.length > 0 && (
          <div className="my-2 border-t border-border/60" aria-hidden />
        )}

        {sortedFolders.map((folder) => (
          <DroppableNavItem
            key={folder.id}
            dropId={`folder-${folder.id}`}
            isActive={currentFolder === folder.id}
            isDragging={isDragging}
            onClick={() => onFolderSelect(folder.id)}
          >
            <FolderIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{folder.name}</span>
            <FolderCountBadge count={getCount(folderSongCounts, folder.id)} />
          </DroppableNavItem>
        ))}

        <AddFolderInline onCreateFolder={onCreateFolder} />
      </nav>

      <div className="shrink-0 border-t border-border/80 px-3 py-3">
        <Link
          href="/playlists"
          className="block rounded-xl px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          {t('songs.manageFolders')}
        </Link>
      </div>
    </aside>
  )
}

function FolderChip({
  label,
  count,
  isActive,
  onClick,
  className,
  compact = false,
}: {
  label: string
  count?: number
  isActive: boolean
  onClick: () => void
  className?: string
  compact?: boolean
}) {
  return (
    <FilterChip
      active={isActive}
      onClick={onClick}
      compact={compact}
      className={className}
    >
      <span className="min-w-0 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'shrink-0 rounded-full font-semibold tabular-nums',
            compact ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]',
            isActive
              ? 'bg-primary/15 text-primary'
              : 'bg-background/80 text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </FilterChip>
  )
}

const MOBILE_CHIP_LIMIT = 3
const MOBILE_INLINE_WHEN_OVERFLOW = 3

type FolderChipItem = {
  id: string
  label: string
  count: number
  isActive: boolean
  onSelect: () => void
}

function sortFoldersBySongCount(folders: Folder[], folderSongCounts: FolderSongCounts): Folder[] {
  return [...folders].sort((a, b) => {
    const countDiff = getCount(folderSongCounts, b.id) - getCount(folderSongCounts, a.id)
    if (countDiff !== 0) return countDiff
    const orderA = a.displayOrder ?? Infinity
    const orderB = b.displayOrder ?? Infinity
    if (orderA !== orderB) return orderA - orderB
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function splitMobileChipItems(
  allItem: FolderChipItem,
  folderItems: FolderChipItem[],
  unorganizedItem: FolderChipItem | null
) {
  const inlineItems = [allItem, ...folderItems]

  if (inlineItems.length <= MOBILE_CHIP_LIMIT) {
    const overflow = unorganizedItem ? [unorganizedItem] : []
    return {
      visible: inlineItems,
      overflow,
      overflowActive: unorganizedItem?.isActive ?? false,
    }
  }

  const folderSlots = MOBILE_INLINE_WHEN_OVERFLOW - 1
  const activeFolder = folderItems.find((item) => item.isActive)

  let visibleFolders = folderItems.slice(0, folderSlots)
  if (activeFolder && !visibleFolders.some((item) => item.id === activeFolder.id)) {
    visibleFolders =
      folderSlots <= 1
        ? [activeFolder]
        : [...folderItems.slice(0, folderSlots - 1), activeFolder]
  }

  const visible = [allItem, ...visibleFolders]
  const visibleIds = new Set(visible.map((item) => item.id))
  const overflowFolders = folderItems
    .filter((item) => !visibleIds.has(item.id))
    .sort((a, b) => b.count - a.count)
  const overflow = [
    ...overflowFolders,
    ...(unorganizedItem ? [unorganizedItem] : []),
  ]

  return {
    visible,
    overflow,
    overflowActive: overflow.some((item) => item.isActive),
  }
}

function FolderChipOverflowMenu({
  items,
  isActive,
  compact = false,
}: {
  items: FolderChipItem[]
  isActive: boolean
  compact?: boolean
}) {
  const { t } = useLanguage()

  if (items.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('common.more')}
          className={cn(
            'relative overflow-hidden',
            compact
              ? 'inline-flex min-h-[28px] min-w-[28px] shrink-0 items-center justify-center rounded-full px-2 py-0.5'
              : 'inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full px-3 py-2 text-sm',
            isActive
              ? 'bg-muted/80 text-primary dark:bg-white/[0.08]'
              : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {isActive ? (
            <span
              key="chip-border-active"
              aria-hidden
              className="chip-snake-border pointer-events-none absolute inset-0 rounded-full"
            />
          ) : null}
          <EllipsisHorizontalIcon className={cn('relative z-10', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(60vh,320px)] overflow-y-auto">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={item.onSelect}
            className={cn('flex items-center justify-between gap-3', item.isActive && 'bg-primary/10 text-primary')}
          >
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {item.count}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SongsFolderChips({
  folders,
  folderSongCounts,
  currentFolder,
  onFolderSelect,
  compact = false,
}: Omit<SongsFolderNavProps, 'onCreateFolder' | 'isDragging'> & { compact?: boolean }) {
  const { t } = useLanguage()
  const foldersBySongCount = useMemo(
    () => sortFoldersBySongCount(folders, folderSongCounts),
    [folders, folderSongCounts]
  )
  const totalCount = getTotalSongCount(folderSongCounts)
  const unorganizedCount = getCount(folderSongCounts, 'null')

  const { visible, overflow, overflowActive } = useMemo(() => {
    const allItem: FolderChipItem = {
      id: 'all',
      label: t('sidebar.allSongs'),
      count: totalCount,
      isActive: isAllActive(currentFolder),
      onSelect: () => onFolderSelect(undefined),
    }

    const unorganizedItem: FolderChipItem = {
      id: 'unorganized',
      label: t('sidebar.unorganizedSongs'),
      count: unorganizedCount,
      isActive: isUnorganizedActive(currentFolder),
      onSelect: () => onFolderSelect('unorganized'),
    }

    const folderItems: FolderChipItem[] = foldersBySongCount.map((folder) => ({
      id: folder.id,
      label: folder.name,
      count: getCount(folderSongCounts, folder.id),
      isActive: currentFolder === folder.id,
      onSelect: () => onFolderSelect(folder.id),
    }))

    return splitMobileChipItems(allItem, folderItems, unorganizedItem)
  }, [
    currentFolder,
    folderSongCounts,
    foldersBySongCount,
    onFolderSelect,
    t,
    totalCount,
    unorganizedCount,
  ])

  return (
    <div
      className={cn(
        'lg:hidden min-w-0',
        compact ? 'flex-1' : 'w-full shrink-0'
      )}
    >
      <div
        className={cn(
          'flex min-w-0 items-stretch gap-1.5',
          compact ? 'justify-start' : 'w-full'
        )}
      >
        {visible.map((item) => (
          <FolderChip
            key={item.id}
            label={item.label}
            count={item.count}
            isActive={item.isActive}
            onClick={item.onSelect}
            compact={compact}
            className={compact ? 'shrink-0 max-w-[7rem]' : 'flex-1 basis-0'}
          />
        ))}
        <FolderChipOverflowMenu items={overflow} isActive={overflowActive} compact={compact} />
      </div>
    </div>
  )
}
