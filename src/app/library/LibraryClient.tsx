'use client'

import { useMemo } from 'react'
import type { Song } from '@/types'
import SongGallery from '@/components/SongGallery'
import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface LibraryClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
}

export default function LibraryClient({ songs, total, page, limit, initialView = 'gallery', initialQuery = '' }: LibraryClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  const q = searchParams?.get('q') ?? initialQuery

  const setView = (v: 'gallery' | 'table') => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('view', v)
    params.set('page', '1')
    params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  const setQuery = (next: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (next) params.set('q', next); else params.delete('q')
    params.set('page', '1')
    params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  const content = useMemo(() => {
    if (view === 'table') {
      return (
        <SongTable
          songs={songs}
          folders={[]}
          playlists={[]}
          hasUser={false}
          onFolderChange={async () => {}}
          onDeleteSongs={async () => {}}
          onDeleteAllSongs={async () => {}}
        />
      )
    }
    return <SongGallery songs={songs} />
  }, [view, songs])

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bibliothèque</h1>
        <div className="flex items-center gap-2">
          <input
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQuery((e.target as HTMLInputElement).value)
            }}
            placeholder="Search title or author..."
            className="px-3 py-1.5 text-sm border rounded-md w-[200px] sm:w-[280px]"
          />
          <div className="inline-flex rounded-md shadow-sm border">
          <button
            className={`px-3 py-1.5 text-sm ${view === 'gallery' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setView('gallery')}
          >
            Gallery
          </button>
          <button
            className={`px-3 py-1.5 text-sm ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
        </div>
        </div>
      </div>
      {content}
      <Pagination page={page} limit={limit} total={total} />
    </div>
  )
}

