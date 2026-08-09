'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { cn } from '@/lib/utils'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { usePageHeader } from '@/context/PageHeaderContext'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Song, Folder } from '@/types'
import { fetchUserSongsListAction } from '@/app/(protected)/songs/actions'
import { useInfiniteScrollLoadMore } from '@/lib/hooks/useInfiniteScrollLoadMore'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortField, SortDirection } from '@/components/SortSelectionModal'
import {
  PlaylistSwitcherStrip,
  type PlaylistStripItem,
} from '@/components/playlists/PlaylistSwitcherStrip'
import { FolderSongList } from '@/components/playlists/FolderSongList'

interface FolderSongsClientProps {
  folder: Folder
  songs: Song[]
  total: number
  page: number
  limit: number
  initialQuery?: string
  initialSortOrder?: 'asc' | 'desc'
  siblingPlaylists?: PlaylistStripItem[]
}

const FOLDER_SORT_FIELDS: SortField[] = ['title', 'author', 'updatedAt', 'viewCount']
const SCROLL_THRESHOLD = 8
const TOP_REVEAL_OFFSET = 24

export default function FolderSongsClient({
  folder,
  songs,
  total,
  page,
  limit,
  initialQuery = '',
  initialSortOrder = 'asc',
  siblingPlaylists = [],
}: FolderSongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const isLandscapeMobile = useLandscapeMobile()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [stripCollapsed, setStripCollapsed] = useState(false)
  const lastScrollTopRef = useRef(0)

  const sortFieldLabels: Record<SortField, string> = {
    title: t('songs.title'),
    author: t('songs.artist'),
    key: t('songs.key'),
    rating: t('songs.rating'),
    reviews: t('songs.reviews'),
    difficulty: t('songs.difficulty'),
    version: t('songs.version'),
    viewCount: t('songs.viewCount'),
    updatedAt: t('songs.modified'),
    createdAt: t('songs.createdAt'),
  }

  const [localSearchValue, setLocalSearchValue] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortOrder)
  const [displaySongs, setDisplaySongs] = useState(songs)
  const [displayTotal, setDisplayTotal] = useState(total)
  const [listPage, setListPage] = useState(page)
  const [isListLoading, setIsListLoading] = useState(false)

  const hasActiveFilters = sortField !== 'title' || sortDirection !== 'asc'
  const folderFilterKey = `${folder.id}:${searchQuery}:${limit}`
  const prevFolderFilterKeyRef = useRef(folderFilterKey)
  const folderLoadingLockRef = useRef(false)

  usePageHeader(folder.name, '/playlists')

  useEffect(() => {
    const filtersChanged = prevFolderFilterKeyRef.current !== folderFilterKey
    prevFolderFilterKeyRef.current = folderFilterKey
    if (filtersChanged || listPage <= 1) {
      setDisplaySongs(songs)
      setDisplayTotal(total)
      setListPage(1)
      folderLoadingLockRef.current = false
    }
  }, [songs, total, folderFilterKey, listPage])

  useEffect(() => {
    setStripCollapsed(false)
    lastScrollTopRef.current = 0
  }, [folder.id])

  const hasMoreSongs = displaySongs.length < displayTotal
  const handleLoadMore = useCallback(() => {
    if (folderLoadingLockRef.current || isListLoading || !hasMoreSongs) return
    folderLoadingLockRef.current = true
    const nextPage = listPage + 1
    setIsListLoading(true)
    void fetchUserSongsListAction({
      page: nextPage,
      limit,
      searchQuery: searchQuery.trim() || undefined,
      folder: folder.id,
    })
      .then((result) => {
        setDisplaySongs((prev) => {
          const seen = new Set(prev.map((s) => s.id))
          const merged = [...prev]
          for (const song of result.songs) {
            if (!seen.has(song.id)) {
              seen.add(song.id)
              merged.push(song)
            }
          }
          return merged
        })
        setDisplayTotal(result.total)
        setListPage(nextPage)
      })
      .catch(console.error)
      .finally(() => {
        folderLoadingLockRef.current = false
        setIsListLoading(false)
      })
  }, [isListLoading, hasMoreSongs, listPage, limit, searchQuery, folder.id])

  const loadMoreSentinelRef = useInfiniteScrollLoadMore({
    enabled: displaySongs.length > 0,
    hasMore: hasMoreSongs,
    loading: isListLoading,
    onLoadMore: handleLoadMore,
  })

  useEffect(() => {
    setLocalSearchValue(initialQuery)
    setSearchQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearchValue.trim()
      setSearchQuery(trimmed)
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (trimmed) {
        params.set('q', trimmed)
        params.set('page', '1')
      } else {
        params.delete('q')
        params.delete('page')
      }
      params.delete('view')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchValue, pathname, router, searchParams])

  useEffect(() => {
    const sortOrderFromUrl = searchParams?.get('sortOrder')
    if (sortOrderFromUrl === 'desc' || sortOrderFromUrl === 'asc') {
      setSortDirection(sortOrderFromUrl)
    }
  }, [searchParams])

  const handleScroll = useCallback(() => {
    const element = scrollContainerRef.current
    if (!element) return
    const scrollTop = element.scrollTop
    const delta = scrollTop - lastScrollTopRef.current

    if (scrollTop <= TOP_REVEAL_OFFSET) {
      setStripCollapsed(false)
    } else if (delta > SCROLL_THRESHOLD) {
      setStripCollapsed(true)
    } else if (delta < -SCROLL_THRESHOLD) {
      setStripCollapsed(false)
    }

    lastScrollTopRef.current = scrollTop
  }, [])

  const replaceSortParams = useCallback(
    (direction: SortDirection) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (direction === 'desc') params.set('sortOrder', 'desc')
      else params.delete('sortOrder')
      params.set('page', '1')
      params.delete('view')
      const query = params.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [pathname, searchParams]
  )

  const updateSortFilters = useCallback(
    (next: { sortField?: SortField; sortDirection?: SortDirection }) => {
      if (next.sortField !== undefined) setSortField(next.sortField)
      if (next.sortDirection !== undefined) {
        setSortDirection(next.sortDirection)
        replaceSortParams(next.sortDirection)
      }
    },
    [replaceSortParams]
  )

  const handleClearSearch = () => {
    setLocalSearchValue('')
    setSearchQuery('')
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('q')
    params.delete('page')
    params.delete('view')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSortField('title')
    setSortDirection('asc')
    replaceSortParams('asc')
  }

  const sortedSongs = useMemo(() => {
    let list = [...displaySongs]
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (song) =>
          song.title.toLowerCase().includes(q) ||
          song.author.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
        case 'author':
          aVal = (a.author || '').toLowerCase()
          bVal = (b.author || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
        case 'updatedAt':
          aVal = new Date(a.updatedAt).getTime()
          bVal = new Date(b.updatedAt).getTime()
          return (aVal as number) - (bVal as number)
        case 'viewCount':
          aVal = a.viewCount ?? 0
          bVal = b.viewCount ?? 0
          return (aVal as number) - (bVal as number)
        default:
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          return (aVal as string).localeCompare(bVal as string)
      }
    })
    if (sortDirection === 'desc') list.reverse()
    return list
  }, [displaySongs, searchQuery, sortField, sortDirection])

  const showStrip = !isInputFocused && !stripCollapsed && siblingPlaylists.length >= 2

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden bg-background',
        isLandscapeMobile ? 'p-1.5' : 'p-4 sm:p-6'
      )}
    >
      <div
        className={cn(
          'relative z-20 shrink-0 bg-background/95 backdrop-blur-md',
          isLandscapeMobile ? 'pb-1.5' : 'pb-3',
          isInputFocused && 'z-30'
        )}
      >
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out',
            showStrip
              ? 'mb-3 grid-rows-[1fr] opacity-100'
              : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0'
          )}
          aria-hidden={!showStrip}
        >
          <div className="overflow-hidden">
            <PlaylistSwitcherStrip
              playlists={siblingPlaylists}
              activePlaylistId={folder.id}
              compact={isLandscapeMobile}
            />
          </div>
        </div>

        <div
          className={cn(
            'flex items-stretch max-lg:transition-[gap] max-lg:duration-200',
            isLandscapeMobile ? 'gap-1.5' : 'gap-2'
          )}
        >
          <div
            className={cn(
              'relative min-w-0 transition-[flex] duration-200',
              isInputFocused ? 'flex-1 max-lg:flex-[1_1_100%]' : 'flex-1'
            )}
          >
            <div className="relative">
              <div
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-0 flex items-center',
                  isLandscapeMobile ? 'pl-2.5' : 'pl-4'
                )}
              >
                <MagnifyingGlassIcon
                  className={cn(
                    'text-muted-foreground',
                    isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
                  )}
                />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => window.setTimeout(() => setIsInputFocused(false), 150)}
                placeholder={t('songs.search')}
                className={cn(
                  'block w-full border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
                  isLandscapeMobile
                    ? 'h-8 rounded-lg py-1 pl-8 pr-8 text-sm'
                    : 'min-h-[44px] rounded-xl py-2.5 pl-12 pr-12 text-sm sm:text-base'
                )}
              />
              {localSearchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={cn(
                    'absolute inset-y-0 right-0 flex items-center justify-center text-muted-foreground hover:text-foreground',
                    isLandscapeMobile
                      ? 'min-h-8 min-w-8 pr-1.5'
                      : 'min-h-[44px] min-w-[44px] pr-4'
                  )}
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className={cn(isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')} />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={cn(
              'relative flex shrink-0 items-center justify-center border border-border bg-background text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
              isLandscapeMobile
                ? 'h-8 w-8 rounded-lg p-0'
                : 'min-h-[44px] min-w-[44px] rounded-xl p-3',
              hasActiveFilters && 'border-primary/40 text-primary',
              isInputFocused &&
                'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
            )}
            aria-label={t('songs.advancedFilters')}
          >
            <AdjustmentsHorizontalIcon
              className={cn(
                'max-lg:shrink-0',
                isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
              )}
            />
            {hasActiveFilters && (
              <span
                className={cn(
                  'absolute rounded-full bg-primary',
                  isLandscapeMobile
                    ? 'right-1 top-1 h-1.5 w-1.5'
                    : 'right-1.5 top-1.5 h-2 w-2'
                )}
              />
            )}
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-main-scroll
        onScroll={handleScroll}
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {sortedSongs.length > 0 ? (
          <>
            <FolderSongList songs={sortedSongs} />
            <div ref={loadMoreSentinelRef} className="h-8 w-full" aria-hidden />
            {isListLoading && hasMoreSongs ? (
              <p className="py-3 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : null}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery.trim() ? t('songs.noResults') : t('folders.noSongsInFolder')}
            </p>
          </div>
        )}
      </div>

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
              <SheetClose className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>

          <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start sm:text-start">
            <SheetTitle className="text-xl font-semibold">{t('songs.advancedFilters')}</SheetTitle>
            <p
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {t('songs.filterResultsCount').replace('{count}', String(displayTotal))}
            </p>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-3">
            <div className="space-y-2">
              <Label
                htmlFor="sortField"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                {t('songs.sortBy')}
              </Label>
              <Select
                value={sortField}
                onValueChange={(value) =>
                  updateSortFilters({ sortField: value as SortField })
                }
              >
                <SelectTrigger
                  id="sortField"
                  className="h-11 w-full rounded-xl border-border/70 bg-muted/40 px-3 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_SORT_FIELDS.map((field) => (
                    <SelectItem key={field} value={field}>
                      {sortFieldLabels[field]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div
                className="flex gap-0.5 rounded-full bg-muted/80 p-0.5"
                role="group"
                aria-label={t('songs.sortOrder')}
              >
                <button
                  type="button"
                  onClick={() => updateSortFilters({ sortDirection: 'asc' })}
                  className={cn(
                    'min-h-[40px] flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
                    sortDirection === 'asc'
                      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('songs.ascending')}
                </button>
                <button
                  type="button"
                  onClick={() => updateSortFilters({ sortDirection: 'desc' })}
                  className={cn(
                    'min-h-[40px] flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
                    sortDirection === 'desc'
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
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {t('common.clear')}
            </Button>
            <Button
              onClick={() => setIsFilterSheetOpen(false)}
              className="h-10 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {t('songs.seeResults').replace('{count}', String(displayTotal))}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
