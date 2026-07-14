'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  Squares2X2Icon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { EXPLORE_DECADES, EXPLORE_DIFFICULTIES, EXPLORE_GENRES } from '@/data/exploreCategories'
import { useLanguage } from '@/context/LanguageContext'
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface ExploreClientProps {
  children: ReactNode
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
}

export default function ExploreClient({
  children,
  limit,
  initialView = 'gallery',
  initialQuery = '',
}: ExploreClientProps) {
  const { t } = useLanguage()
  const [localSearch, setLocalSearch] = useState(initialQuery)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [draftDifficulty, setDraftDifficulty] = useState<string | null>(null)
  const [draftDecade, setDraftDecade] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)

  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  const currentGenre = searchParams?.get('genre') || null
  const currentDifficulty = searchParams?.get('difficulty') || null
  const currentDecade = searchParams?.get('decade') || null
  const hasAdvancedFilters = !!(currentDifficulty || currentDecade)

  useEffect(() => {
    setLocalSearch(initialQuery)
  }, [initialQuery])

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    mutate(params)
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateFilter = (type: 'genre' | 'difficulty' | 'decade', value: string | number | null) => {
    pushParams((params) => {
      if (value) params.set(type, String(value))
      else params.delete(type)
      params.set('page', '1')
      params.set('limit', String(limit))
    })
  }

  const applySearch = (query: string) => {
    pushParams((params) => {
      const trimmed = query.trim()
      if (trimmed) params.set('q', trimmed)
      else params.delete('q')
      params.set('page', '1')
      params.set('limit', String(limit))
    })
  }

  const setView = (nextView: 'gallery' | 'table') => {
    pushParams((params) => {
      params.set('view', nextView)
      params.set('page', '1')
      params.set('limit', String(limit))
    })
  }

  const openFilterSheet = () => {
    setDraftDifficulty(currentDifficulty)
    setDraftDecade(currentDecade)
    setIsFilterSheetOpen(true)
  }

  const applyAdvancedFilters = () => {
    pushParams((params) => {
      if (draftDifficulty) params.set('difficulty', draftDifficulty)
      else params.delete('difficulty')
      if (draftDecade) params.set('decade', draftDecade)
      else params.delete('decade')
      params.set('page', '1')
      params.set('limit', String(limit))
    })
    setIsFilterSheetOpen(false)
  }

  const clearAdvancedFilters = () => {
    setDraftDifficulty(null)
    setDraftDecade(null)
    pushParams((params) => {
      params.delete('difficulty')
      params.delete('decade')
      params.set('page', '1')
      params.set('limit', String(limit))
    })
    setIsFilterSheetOpen(false)
  }

  const viewToggle = (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted/80 p-0.5">
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 sm:h-10 sm:w-10',
          view === 'gallery'
            ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setView('gallery')}
        title={t('explore.GALLERY_VIEW')}
        aria-label={t('explore.GALLERY_VIEW')}
      >
        <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 sm:h-10 sm:w-10',
          view === 'table'
            ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setView('table')}
        title={t('explore.TABLE_VIEW')}
        aria-label={t('explore.TABLE_VIEW')}
      >
        <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  )

  const genreFilters = (
    <div className="lg:hidden">
      <FilterChipRow>
        <FilterChip active={!currentGenre} onClick={() => updateFilter('genre', null)}>
          {t('explore.ALL_FILTER')}
        </FilterChip>
        {EXPLORE_GENRES.map((genre) => (
          <FilterChip
            key={genre.id}
            active={currentGenre === genre.id}
            onClick={() => updateFilter('genre', genre.id)}
          >
            {genre.name}
          </FilterChip>
        ))}
      </FilterChipRow>
    </div>
  )

  const allFilterSections = (
    <div className="hidden space-y-3 lg:block">
      <FilterChipRow title={t('explore.GENRES_SECTION')}>
        <FilterChip active={!currentGenre} onClick={() => updateFilter('genre', null)}>
          {t('explore.ALL_FILTER')}
        </FilterChip>
        {EXPLORE_GENRES.map((genre) => (
          <FilterChip
            key={genre.id}
            active={currentGenre === genre.id}
            onClick={() => updateFilter('genre', genre.id)}
          >
            {genre.name}
          </FilterChip>
        ))}
      </FilterChipRow>

      <FilterChipRow title={t('explore.LEVELS_SECTION')}>
        <FilterChip active={!currentDifficulty} onClick={() => updateFilter('difficulty', null)}>
          {t('explore.ALL_FILTER')}
        </FilterChip>
        {EXPLORE_DIFFICULTIES.map((difficulty) => (
          <FilterChip
            key={difficulty.id}
            active={currentDifficulty === difficulty.id}
            onClick={() => updateFilter('difficulty', difficulty.id)}
          >
            {difficulty.name}
          </FilterChip>
        ))}
      </FilterChipRow>

      <FilterChipRow title={t('explore.DECADES_SECTION')}>
        <FilterChip active={!currentDecade} onClick={() => updateFilter('decade', null)}>
          {t('explore.ALL_DECADES_FILTER')}
        </FilterChip>
        {EXPLORE_DECADES.map((decade) => (
          <FilterChip
            key={decade.year}
            active={currentDecade === String(decade.year)}
            onClick={() => updateFilter('decade', decade.year)}
          >
            {decade.name}
          </FilterChip>
        ))}
      </FilterChipRow>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-3 sm:p-6">
      <div
        ref={scrollContainerRef}
        data-main-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="space-y-3 pb-4">
          <div className="flex items-stretch gap-2">
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch(localSearch)
                }}
                placeholder={t('explore.SEARCH_PLACEHOLDER')}
                className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-3 sm:pl-12 sm:pr-12 sm:text-base"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('')
                    applySearch('')
                  }}
                  className="absolute inset-y-0 right-0 flex min-h-[36px] min-w-[36px] items-center justify-center pr-2 text-muted-foreground hover:text-foreground sm:min-h-[44px] sm:min-w-[44px] sm:pr-3"
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={openFilterSheet}
              className={cn(
                'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden',
                hasAdvancedFilters && 'border-primary/40 text-primary'
              )}
              aria-label={t('explore.ADVANCED_FILTERS')}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              {hasAdvancedFilters && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {viewToggle}
          </div>

          {genreFilters}
          {allFilterSections}
        </div>

        <div className="pb-6">{children}</div>
      </div>

      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[min(70vh,520px)] flex-col overflow-hidden rounded-t-[1.75rem] border-0 bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
        >
          <div className="flex shrink-0 items-center py-1.5">
            <div className="flex-1" aria-hidden />
            <div className="h-1 w-14 shrink-0 rounded-full bg-muted-foreground/25" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70 hover:opacity-100">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>

          <SheetHeader className="shrink-0 px-1 pb-2">
            <SheetTitle className="text-xl font-semibold">{t('explore.ADVANCED_FILTERS')}</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4">
            <FilterChipRow title={t('explore.LEVELS_SECTION')}>
              <FilterChip
                active={!draftDifficulty}
                onClick={() => setDraftDifficulty(null)}
              >
                {t('explore.ALL_FILTER')}
              </FilterChip>
              {EXPLORE_DIFFICULTIES.map((difficulty) => (
                <FilterChip
                  key={difficulty.id}
                  active={draftDifficulty === difficulty.id}
                  onClick={() => setDraftDifficulty(difficulty.id)}
                >
                  {difficulty.name}
                </FilterChip>
              ))}
            </FilterChipRow>

            <FilterChipRow title={t('explore.DECADES_SECTION')}>
              <FilterChip active={!draftDecade} onClick={() => setDraftDecade(null)}>
                {t('explore.ALL_DECADES_FILTER')}
              </FilterChip>
              {EXPLORE_DECADES.map((decade) => (
                <FilterChip
                  key={decade.year}
                  active={draftDecade === String(decade.year)}
                  onClick={() => setDraftDecade(String(decade.year))}
                >
                  {decade.name}
                </FilterChip>
              ))}
            </FilterChipRow>
          </div>

          <SheetFooter className="shrink-0 flex-row gap-2 border-t border-border/50 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={clearAdvancedFilters}>
              {t('explore.CLEAR_FILTERS')}
            </Button>
            <Button type="button" className="flex-1" onClick={applyAdvancedFilters}>
              {t('explore.APPLY_FILTERS')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
