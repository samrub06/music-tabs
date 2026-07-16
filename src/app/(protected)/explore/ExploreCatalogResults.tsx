'use client'

import { useEffect, useRef } from 'react'
import type { Song } from '@/types'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import SongGallery from '@/components/SongGallery'
import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'

interface ExploreCatalogResultsProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  view: 'gallery' | 'table'
  userId?: string
}

export default function ExploreCatalogResults({
  songs,
  total,
  page,
  limit,
  view,
  userId,
}: ExploreCatalogResultsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prefetchedRef = useRef<Set<string>>(new Set())

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const searchParamsKey = searchParams?.toString() ?? ''

  useEffect(() => {
    const prefetchPage = (nextPage: number) => {
      const params = new URLSearchParams(searchParamsKey)
      params.set('page', String(nextPage))
      params.set('limit', String(limit))
      const href = `${pathname}?${params.toString()}`
      const prefetchKey = `${href}|${nextPage}`

      if (prefetchedRef.current.has(prefetchKey)) return
      prefetchedRef.current.add(prefetchKey)
      router.prefetch(href)
    }

    if (page > 1) prefetchPage(page - 1)
    if (page < totalPages) prefetchPage(page + 1)
  }, [page, limit, totalPages, pathname, searchParamsKey, router])

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-foreground">{t('explore.EMPTY_TITLE')}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t('explore.EMPTY_DESCRIPTION')}
        </p>
      </div>
    )
  }

  if (view === 'table') {
    return (
      <>
        <SongTable
          songs={songs}
          folders={[]}
          playlists={[]}
          hasUser={!!userId}
          onFolderChange={async () => {}}
          onDeleteSongs={async () => {}}
          onDeleteAllSongs={async () => {}}
        />
        <Pagination page={page} limit={limit} total={total} />
      </>
    )
  }

  return (
    <>
      <SongGallery songs={songs} variant="folder" hasUser={!!userId} />
      <Pagination page={page} limit={limit} total={total} />
    </>
  )
}
