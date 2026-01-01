'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Song } from '@/types'
import SongGallery from '@/components/SongGallery'
import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { XMarkIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline'

interface LibraryClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  initialView?: 'gallery' | 'table'
  initialQuery?: string
  userId?: string
}

export default function LibraryClient({ songs, total, page, limit, initialView = 'gallery', initialQuery = '', userId }: LibraryClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const view = (searchParams?.get('view') as 'gallery' | 'table') || initialView
  const q = searchParams?.get('q') ?? initialQuery
  const [localSearchValue, setLocalSearchValue] = useState(q)

  // Sync localSearchValue with URL changes
  useEffect(() => {
    setLocalSearchValue(q)
  }, [q])

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

  const handleAddToLibrary = useCallback(async (song: Song) => {
    // If not logged in, redirect to login
    if (!userId) {
      router.push('/login?next=/library')
      return
    }

    try {
      setCloningId(song.id)
      await cloneSongAction(song.id)
      router.refresh()
      // You might want to show a toast/notification here
    } catch (error) {
      console.error('Error cloning song:', error)
    } finally {
      setCloningId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const content = useMemo(() => {
    if (view === 'table') {
      return (
        <SongTable
          songs={songs}
          folders={[]}
          playlists={[]}
          hasUser={!!userId}
          onFolderChange={async () => {}}
          onDeleteSongs={async () => {}}
          onDeleteAllSongs={async () => {}}
        />
      )
    }
    return (
      <SongGallery 
        songs={songs} 
        showAddButton={true}
        onAddClick={handleAddToLibrary}
        addingId={cloningId}
      />
    )
  }, [view, songs, userId, cloningId, handleAddToLibrary])

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:gap-4">       
          
          {/* Search and View Controls */}
          <div className="flex flex-row items-center gap-2 sm:gap-2 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial sm:max-w-xs min-w-0 w-full sm:min-w-[180px]">
              <input
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setQuery((e.target as HTMLInputElement).value)
                  }
                }}
                placeholder="Search title or author..."
                className="block w-full px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {localSearchValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLocalSearchValue('')
                    setQuery('')
                  }}
                  className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
            
            {/* View Toggle */}
            <div className="inline-flex rounded-md shadow-sm border overflow-hidden">
              <button
                className={`px-2 sm:px-3 py-1.5 text-sm flex items-center justify-center ${view === 'gallery' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setView('gallery')}
                title="Gallery View"
              >
                <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                className={`px-2 sm:px-3 py-1.5 text-sm flex items-center justify-center border-l ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setView('table')}
                title="Table View"
              >
                <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {content}
      <Pagination page={page} limit={limit} total={total} />
    </div>
  )
}
