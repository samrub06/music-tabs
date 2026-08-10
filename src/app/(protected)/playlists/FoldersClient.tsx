'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { cn } from '@/lib/utils'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { FolderCover } from '@/components/presentational/FolderCover'
import { PlaylistListCard } from '@/components/library/playlistCards/PlaylistListCard'
import { HubZoneHeader } from '@/components/library/HubZoneHeader'
import { HubZonePlaylistSection } from '@/components/library/HubZonePlaylistSection'
import CuratedPlaylistRow from '@/components/library/CuratedPlaylistRow'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import { Folder } from '@/types'
import { updateFolderOrderAction } from './actions'
import { CreateFolderSheet } from '@/components/playlists/CreateFolderSheet'
import Snackbar from '@/components/Snackbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { getHubZoneForSlug, isFrenchCatalogSlug } from '@/data/curatedPlaylists'
import {
  loadPlaylistsHubSeeAllPref,
  savePlaylistsHubSeeAllPref,
} from '@/utils/playlistHubSeeAllPref'

type PlaylistScope = 'all' | 'mine' | 'religious' | 'international' | 'french'

interface FoldersClientProps {
  folders: Folder[]
  folderSongCounts: Map<string, number>
  explorerPlaylists: PublicPlaylistItem[]
}

function MineFolderCard({
  folder,
  songCount,
  isDragMode,
}: {
  folder: Folder
  songCount: number
  isDragMode: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id, disabled: !isDragMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const cover = (
    <FolderCover
      imageUrl={folder.imageUrl}
      name={folder.name}
      songCount={songCount}
      className="h-full w-full rounded-md"
      shapeClassName="h-full w-full"
    />
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative min-w-0 snap-start', isDragging && 'opacity-50')}
    >
      <PlaylistListCard
        href={`/playlists/${folder.id}`}
        title={folder.name}
        media={cover}
        coverUrl={folder.imageUrl}
      />
      {isDragMode && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-1.5 right-1.5 z-10 touch-none rounded-md bg-background/90 p-1 shadow-sm backdrop-blur-sm"
          style={{ touchAction: 'none' }}
          onClick={(e) => e.preventDefault()}
          aria-label="Reorder"
        >
          <Bars3Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

export default function FoldersClient({
  folders: initialFolders,
  folderSongCounts,
  explorerPlaylists,
}: FoldersClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)

  const [folders, setFolders] = useState(initialFolders)
  const [scope, setScope] = useState<PlaylistScope>('all')
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchValue, setLocalSearchValue] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(true)
  const searchClosedByUserRef = useRef(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'songCount'>('songCount')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [draftSortBy, setDraftSortBy] = useState<'name' | 'createdAt' | 'songCount'>('songCount')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('desc')
  const [hubSeeAll, setHubSeeAll] = useState(false)

  useEffect(() => {
    setFolders(initialFolders)
  }, [initialFolders])

  useEffect(() => {
    setHubSeeAll(loadPlaylistsHubSeeAllPref())
  }, [])

  const toggleHubSeeAll = useCallback(() => {
    setHubSeeAll((prev) => {
      const next = !prev
      savePlaylistsHubSeeAllPref(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (scope !== 'mine') setIsDragMode(false)
  }, [scope])

  const hasActiveFilters = sortBy !== 'songCount' || sortDirection !== 'desc'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )
  const activeSensors = isDragMode ? sensors : []

  const getSongCount = useCallback(
    (folderId: string) => folderSongCounts.get(folderId) || 0,
    [folderSongCounts]
  )

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearchValue), 300)
    return () => clearTimeout(timer)
  }, [localSearchValue])

  const handleScrollChrome = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const atTop = el.scrollTop <= 24
    if (atTop) {
      if (!searchClosedByUserRef.current) {
        setSearchExpanded(true)
      }
    } else {
      searchClosedByUserRef.current = false
      setSearchExpanded(false)
    }
  }, [])

  const closeSearch = useCallback(() => {
    searchClosedByUserRef.current = true
    setSearchExpanded(false)
    searchInputRef.current?.blur()
  }, [])

  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
  }

  const filteredExplorer = useMemo(() => {
    let list = [...explorerPlaylists]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (scope === 'religious') {
      list = list.filter(
        (p) => !!p.curatedSlug && getHubZoneForSlug(p.curatedSlug) === 'songbook'
      )
    } else if (scope === 'international') {
      list = list.filter(
        (p) => !!p.curatedSlug && getHubZoneForSlug(p.curatedSlug) === 'international'
      )
    } else if (scope === 'french') {
      list = list.filter((p) => !!p.curatedSlug && isFrenchCatalogSlug(p.curatedSlug))
    }
    list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [explorerPlaylists, searchQuery, scope])

  const filteredFolders = useMemo(() => {
    let filtered = [...folders]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((folder) => folder.name.toLowerCase().includes(q))
    }
    if (isDragMode) {
      const orderMap = new Map(folders.map((folder, index) => [folder.id, index]))
      filtered.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    } else {
      filtered.sort((a, b) => {
        let compareA: string | number
        let compareB: string | number
        switch (sortBy) {
          case 'name':
            compareA = a.name.toLowerCase()
            compareB = b.name.toLowerCase()
            break
          case 'createdAt':
            compareA = new Date(a.createdAt).getTime()
            compareB = new Date(b.createdAt).getTime()
            break
          case 'songCount':
            compareA = getSongCount(a.id)
            compareB = getSongCount(b.id)
            break
          default:
            compareA = a.name.toLowerCase()
            compareB = b.name.toLowerCase()
        }
        let result: number
        if (typeof compareA === 'string' && typeof compareB === 'string') {
          result =
            sortDirection === 'asc'
              ? compareA.localeCompare(compareB)
              : compareB.localeCompare(compareA)
        } else {
          result =
            sortDirection === 'asc'
              ? (compareA as number) - (compareB as number)
              : (compareB as number) - (compareA as number)
        }
        if (result !== 0) return result
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      })
    }
    return filtered
  }, [folders, searchQuery, sortBy, sortDirection, getSongCount, isDragMode])

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedFolder(folders.find((f) => f.id === event.active.id) || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedFolder(null)
    setError(null)
    if (!over || active.id === over.id) return

    const oldIndex = folders.findIndex((f) => f.id === active.id)
    const newIndex = folders.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const movedFolder = folders[oldIndex]
    const tempFolders = arrayMove([...folders], oldIndex, newIndex)
    let newOrder: number

    if (newIndex === 0) {
      const firstOrder = tempFolders[1]?.displayOrder
      newOrder = firstOrder !== undefined ? firstOrder - 1.0 : 0.0
    } else if (newIndex === folders.length - 1) {
      const prevOrder = tempFolders[newIndex - 1]?.displayOrder
      newOrder = prevOrder !== undefined ? prevOrder + 1.0 : folders.length
    } else {
      const prevOrder = tempFolders[newIndex - 1]?.displayOrder
      const nextOrder = tempFolders[newIndex + 1]?.displayOrder
      if (prevOrder !== undefined && nextOrder !== undefined) {
        newOrder = (prevOrder + nextOrder) / 2
      } else if (prevOrder !== undefined) {
        newOrder = prevOrder + 1.0
      } else if (nextOrder !== undefined) {
        newOrder = nextOrder - 1.0
      } else {
        newOrder = newIndex + 1.0
      }
    }

    setFolders(arrayMove(folders, oldIndex, newIndex))
    try {
      await updateFolderOrderAction(movedFolder.id, newOrder)
      setSuccessMessage(`"${movedFolder.name}" réorganisé avec succès`)
      router.refresh()
    } catch (err) {
      console.error('Error updating folder order:', err)
      setError(t('folders.reorganizeError'))
      setFolders(folders)
    }
  }

  const handleApplyFilters = () => {
    setSortBy(draftSortBy)
    setSortDirection(draftSortDirection)
    setIsFilterSheetOpen(false)
  }

  const handleClearFilters = () => {
    setDraftSortBy('songCount')
    setDraftSortDirection('desc')
    setSortBy('songCount')
    setSortDirection('desc')
    setIsFilterSheetOpen(false)
  }

  const openFilterSheet = () => {
    setDraftSortBy(sortBy)
    setDraftSortDirection(sortDirection)
    setIsFilterSheetOpen(true)
  }

  const scrollGridClass =
    'grid grid-flow-col grid-rows-3 gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory auto-cols-[calc((100%-0.5rem)/2)] sm:auto-cols-[calc((100%-1rem)/3)] lg:auto-cols-[calc((100%-1.5rem)/4)]'
  const scrollGridStyle = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    WebkitOverflowScrolling: 'touch' as const,
  }

  const emptyExplorer = filteredExplorer.length === 0
  const emptyMine = filteredFolders.length === 0
  const showExplorer = scope !== 'mine'

  const scopeChips: { id: PlaylistScope; label: string }[] = [
    { id: 'all', label: t('folders.filterAll') },
    { id: 'mine', label: t('folders.filterMine') },
    { id: 'religious', label: t('library.hubSongbookTab') },
    { id: 'international', label: t('library.hubInternationalTab') },
    { id: 'french', label: t('folders.filterFrench') },
  ]

  return (
    <DndContext
      sensors={activeSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6">
        <div className="relative z-20 shrink-0 bg-background/95 pb-3 backdrop-blur-md">
          {/* Chips / actions stay sticky; full search sits above content in scroll. */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {scopeChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setScope(chip.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                    scope === chip.id
                      ? 'bg-foreground text-background'
                      : 'bg-muted/80 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {scope === 'mine' && (
              <button
                type="button"
                onClick={openFilterSheet}
                className={cn(
                  'relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-background p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
                  hasActiveFilters && 'border-primary/40 text-primary'
                )}
                aria-label={t('songs.advancedFilters')}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                {hasActiveFilters && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCreateSheetOpen(true)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t('folders.newFolder')}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          data-main-scroll
          onScroll={handleScrollChrome}
          className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Full search lives in the scroll flow above Israeli / mine content. */}
          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out',
              searchExpanded
                ? 'mb-3 grid-rows-[1fr] opacity-100'
                : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0'
            )}
            aria-hidden={!searchExpanded}
          >
            <div className="overflow-hidden">
              <div className="flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={localSearchValue}
                    onChange={(e) => setLocalSearchValue(e.target.value)}
                    placeholder={t('folders.searchPlaceholder')}
                    tabIndex={searchExpanded ? 0 : -1}
                    className="block min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm leading-normal text-foreground placeholder:text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:pl-12 sm:pr-12"
                  />
                  {localSearchValue ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={t('common.clear')}
                      tabIndex={searchExpanded ? 0 : -1}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                  tabIndex={searchExpanded ? 0 : -1}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {showExplorer ? (
            emptyExplorer ? (
              <div className="py-12 text-center">
                <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  {explorerPlaylists.length > 0
                    ? t('folders.noFoldersFound')
                    : t('folders.noExplorerPlaylists')}
                </h3>
                {explorerPlaylists.length > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">{t('folders.noFoldersMatch')}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {(scope === 'all' || scope === 'religious') && (
                  <div id="hub-zone-songbook" className="mb-2 scroll-mt-24">
                    <HubZoneHeader
                      zone="songbook"
                      seeAll={hubSeeAll}
                      onSeeAllToggle={toggleHubSeeAll}
                    />
                    <HubZonePlaylistSection
                      hubZone="songbook"
                      publicPlaylists={filteredExplorer}
                      showSwipeHint={scope === 'all' && !searchQuery.trim() && !hubSeeAll}
                      seeAll={hubSeeAll}
                    />
                  </div>
                )}
                {scope === 'all' && (
                  <div id="hub-zone-israeli" className="mb-2 scroll-mt-24">
                    <HubZoneHeader
                      zone="israeli"
                      seeAll={hubSeeAll}
                      onSeeAllToggle={toggleHubSeeAll}
                    />
                    <HubZonePlaylistSection
                      hubZone="israeli"
                      publicPlaylists={filteredExplorer}
                      showSwipeHint={!searchQuery.trim() && !hubSeeAll}
                      seeAll={hubSeeAll}
                    />
                  </div>
                )}
                {(scope === 'all' || scope === 'international' || scope === 'french') && (
                  <div id="hub-zone-international" className="mb-2 scroll-mt-24">
                    <HubZoneHeader
                      zone="international"
                      seeAll={hubSeeAll}
                      onSeeAllToggle={toggleHubSeeAll}
                    />
                    <HubZonePlaylistSection
                      hubZone="international"
                      publicPlaylists={filteredExplorer}
                      seeAll={hubSeeAll}
                    />
                  </div>
                )}
                {scope === 'all' && (
                  <>
                    <CuratedPlaylistRow section="decade" publicPlaylists={filteredExplorer} />
                    <CuratedPlaylistRow section="difficulty" publicPlaylists={filteredExplorer} />
                  </>
                )}
              </div>
            )
          ) : emptyMine ? (
            <div className="py-12 text-center">
              <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                {folders.length > 0 ? t('folders.noFoldersFound') : t('folders.noFolders')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {folders.length > 0 ? t('folders.noFoldersMatch') : t('folders.startCreating')}
              </p>
            </div>
          ) : (
            <SortableContext
              items={filteredFolders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={scrollGridClass} style={scrollGridStyle}>
                {filteredFolders.map((folder) => (
                  <MineFolderCard
                    key={folder.id}
                    folder={folder}
                    songCount={getSongCount(folder.id)}
                    isDragMode={isDragMode}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      <DragOverlay>
        {draggedFolder ? (
          <div className="rounded-lg bg-background/95 p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-12 shrink-0">
                <FolderCover
                  imageUrl={draggedFolder.imageUrl}
                  name={draggedFolder.name}
                  songCount={getSongCount(draggedFolder.id)}
                />
              </div>
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {draggedFolder.name}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <Snackbar
        message={successMessage || ''}
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        type="success"
        duration={3000}
      />
      <Snackbar
        message={error || ''}
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        duration={5000}
      />

      <CreateFolderSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        existingNames={folders.map((folder) => folder.name)}
        onCreated={(created) => {
          setScope('mine')
          setFolders((prev) => {
            if (prev.some((f) => f.id === created.id)) return prev
            return [
              {
                id: created.id,
                name: created.name,
                displayOrder: created.displayOrder,
                imageUrl: created.imageUrl,
                parentId: created.parentId,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
              },
              ...prev,
            ]
          })
          setSuccessMessage(`"${created.name}"`)
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          router.refresh()
        }}
      />

      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="bg-black/35 dark:bg-black/50"
          className="flex h-auto max-h-[min(48vh,380px)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] bg-background/95 p-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-background/98 dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
        >
          <div className="flex shrink-0 items-center px-4 py-1.5">
            <div className="flex-1" aria-hidden />
            <div className="h-1 w-14 shrink-0 touch-none rounded-full bg-muted-foreground/25" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>
          <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start">
            <SheetTitle className="text-xl font-semibold">{t('songs.advancedFilters')}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3">
            <div className="space-y-2">
              <Label htmlFor="sortBy" className="block text-[11px] font-medium text-muted-foreground">
                {t('folders.sortBy')}
              </Label>
              <Select
                value={draftSortBy}
                onValueChange={(value) =>
                  setDraftSortBy(value as 'name' | 'createdAt' | 'songCount')
                }
              >
                <SelectTrigger
                  id="sortBy"
                  className="h-11 w-full rounded-xl border-border/70 bg-muted/40 px-3 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="songCount">{t('folders.songCount')}</SelectItem>
                  <SelectItem value="name">{t('songs.title')}</SelectItem>
                  <SelectItem value="createdAt">{t('songs.createdAt')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-0.5 rounded-full bg-muted/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setDraftSortDirection('asc')}
                  className={cn(
                    'min-h-[40px] flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
                    draftSortDirection === 'asc'
                      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('songs.ascending')}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSortDirection('desc')}
                  className={cn(
                    'min-h-[40px] flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
                    draftSortDirection === 'desc'
                      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('songs.descending')}
                </button>
              </div>
            </div>
          </div>
          <SheetFooter className="safe-area-inset-bottom flex shrink-0 flex-row gap-3 border-t border-black/[0.06] px-5 py-3 pb-6 dark:border-white/[0.08]">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
            >
              {t('common.clear')}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
            >
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}
