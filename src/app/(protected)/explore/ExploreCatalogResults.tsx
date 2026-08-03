'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Song } from '@/types'
import { useSearchParams } from 'next/navigation'
import SongGallery from '@/components/SongGallery'
import SongTable from '@/components/SongTable'
import { useLanguage } from '@/context/LanguageContext'
import { useInfiniteScrollLoadMore } from '@/lib/hooks/useInfiniteScrollLoadMore'
import { fetchExploreCatalogPageAction } from './actions'

interface ExploreCatalogResultsProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  view: 'gallery' | 'table'
  userId?: string
}

export default function ExploreCatalogResults({
  songs: initialSongs,
  total: initialTotal,
  page: initialPage,
  limit,
  view,
  userId,
}: ExploreCatalogResultsProps) {
  const { t } = useLanguage()
  const searchParams = useSearchParams()

  // Filters only — never include `page` (append must not reset the list).
  const filterKey = useMemo(() => {
    const q = searchParams?.get('q') ?? searchParams?.get('searchQuery') ?? ''
    const genre = searchParams?.get('genre') ?? ''
    const difficulty = searchParams?.get('difficulty') ?? ''
    const decade = searchParams?.get('decade') ?? ''
    return `${q}:${genre}:${difficulty}:${decade}:${view}:${limit}`
  }, [searchParams, view, limit])

  const [items, setItems] = useState(initialSongs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const loadingLockRef = useRef(false)

  useEffect(() => {
    setItems(initialSongs)
    setTotal(initialTotal)
    setPage(1)
    loadingLockRef.current = false
  }, [filterKey, initialSongs, initialTotal])

  const hasMore = items.length < total

  const handleLoadMore = useCallback(() => {
    if (loadingLockRef.current || loading || !hasMore) return
    loadingLockRef.current = true
    const nextPage = page + 1
    setLoading(true)
    const q = searchParams?.get('q') ?? searchParams?.get('searchQuery') ?? undefined
    const genre = searchParams?.get('genre') ?? undefined
    const difficulty = searchParams?.get('difficulty') ?? undefined
    const decadeRaw = searchParams?.get('decade')
    const decade = decadeRaw ? Number(decadeRaw) : undefined

    void fetchExploreCatalogPageAction({
      page: nextPage,
      limit,
      q: q || undefined,
      genre,
      difficulty,
      decade: Number.isFinite(decade) ? decade : undefined,
    })
      .then((result) => {
        setItems((prev) => {
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
        setTotal(result.total)
        setPage(nextPage)
      })
      .catch(console.error)
      .finally(() => {
        loadingLockRef.current = false
        setLoading(false)
      })
  }, [loading, hasMore, page, limit, searchParams])

  const sentinelRef = useInfiniteScrollLoadMore({
    enabled: items.length > 0,
    hasMore,
    loading,
    onLoadMore: handleLoadMore,
  })

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-foreground">{t('explore.EMPTY_TITLE')}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t('explore.EMPTY_DESCRIPTION')}
        </p>
      </div>
    )
  }

  return (
    <>
      {view === 'table' ? (
        <SongTable
          songs={items}
          folders={[]}
          playlists={[]}
          hasUser={!!userId}
          onFolderChange={async () => {}}
          onDeleteSongs={async () => {}}
          onDeleteAllSongs={async () => {}}
        />
      ) : (
        <SongGallery songs={items} variant="folder" hasUser={!!userId} />
      )}
      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      {loading && hasMore ? (
        <p className="py-3 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : null}
    </>
  )
}
