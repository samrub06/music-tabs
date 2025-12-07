'use client'

import { useMemo, useState } from 'react'
import { Song } from '@/types'
import { PlusIcon } from '@heroicons/react/24/outline'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { useRouter } from 'next/navigation'
import SongGallery from '@/components/SongGallery'
import SongTableCompact from '@/components/SongTableCompact'
import Pagination from '@/components/Pagination'
import SongTable from '@/components/SongTable'
import { usePathname, useSearchParams } from 'next/navigation'

interface ExploreClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  userId?: string
}

export default function ExploreClient({ songs, total, page, limit, initialView = 'gallery', initialQuery = '', userId }: ExploreClientProps) {
  const [cloningId, setCloningId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  const q = searchParams?.get('q') ?? initialQuery

  const handleAddToLibrary = async (song: Song) => {
    if (!userId) {
      router.push('/login?next=/explore')
      return
    }

    try {
      setCloningId(song.id)
      await cloneSongAction(song.id)
      router.refresh() // Refresh to maybe update UI state if we tracked "added" status
    } catch (error) {
      console.error('Error cloning song:', error)
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tendances 📈
        </h1>
        <div className="flex items-center gap-2">
          <input
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params = new URLSearchParams(searchParams?.toString() || '')
                const next = (e.target as HTMLInputElement).value
                if (next) params.set('q', next); else params.delete('q')
                params.set('page', '1')
                params.set('limit', String(limit))
                router.push(`${pathname}?${params.toString()}`)
              }
            }}
            placeholder="Search title or author..."
            className="px-3 py-1.5 text-sm border rounded-md w-[200px] sm:w-[280px]"
          />
          <div className="inline-flex rounded-md shadow-sm border">
            <a href="?view=gallery" className={`px-3 py-1.5 text-sm ${view === 'gallery' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}>Gallery</a>
            <a href="?view=table" className={`px-3 py-1.5 text-sm ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}>Table</a>
          </div>
        </div>
      </div>

      {songs && songs.length > 0 ? (
        view === 'table' ? (
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
        ) : (
          <>
            <SongGallery 
              songs={songs} 
              showAddButton={!!userId} 
              onAddClick={handleAddToLibrary} 
              addingId={cloningId}
            />
            <Pagination page={page} limit={limit} total={total} />
          </>
        )
      ) : null}
    </div>
  )
}

