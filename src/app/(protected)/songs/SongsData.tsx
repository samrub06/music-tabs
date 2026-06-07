import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
import { playlistRepo } from '@/lib/services/playlistRepo'
import SongsClient from './SongsClient'
import type { Playlist } from '@/types'

type OrderByOption = 'created_at' | 'updated_at' | 'view_count'

async function SongsDataLoader({
  page,
  limit,
  q,
  tab,
  initialSongId,
  initialFolder,
  initialSortOrder,
  easyChord,
  capoFilter,
  likedOnly,
}: {
  page: number
  limit: number
  q: string
  tab: 'all' | 'recent' | 'popular'
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
  easyChord?: boolean
  capoFilter?: 'any' | 'with' | 'without'
  likedOnly?: boolean
}) {
  const supabase = await createSafeServerClient()
  const orderBy: OrderByOption = tab === 'recent' ? 'updated_at' : tab === 'popular' ? 'view_count' : 'created_at'
  const folderId = initialFolder === 'unorganized' ? 'unorganized' : initialFolder
  const { songs, total } = await songService.getAllSongs(
    supabase,
    page,
    limit,
    q,
    orderBy,
    easyChord,
    capoFilter,
    likedOnly,
    folderId
  )
  return { songs, total }
}

async function PlaylistsDataLoader(): Promise<Playlist[]> {
  const supabase = await createSafeServerClient()
  // Use lightweight version - only load id, name, songCount, createdAt
  const playlistsLightweight = await playlistRepo(supabase).getAllPlaylistsLightweight()
  // Map to full Playlist type for compatibility
  return playlistsLightweight.map(p => ({
    id: p.id,
    name: p.name,
    description: undefined,
    createdAt: p.createdAt,
    updatedAt: p.createdAt, // Use createdAt as fallback
    songIds: [] // Will be loaded when playlist is clicked
  }))
}

function SongsSkeleton() {
  return (
    <div className="p-3 sm:p-6">
      <div className="h-10 bg-gray-100 rounded-lg w-full max-w-2xl mb-6 animate-pulse"></div>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-4 border-b">
            <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function SongsData({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; limit?: string; searchQuery?: string; songId?: string; folder?: string; sortOrder?: string; tab?: string; easyChord?: string; capo?: string; filter?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '50', 10))
  const q = params?.searchQuery || ''
  const tabParam = params?.tab as string | undefined
  const tab = (tabParam === 'recent' || tabParam === 'popular' ? tabParam : 'all') as 'all' | 'recent' | 'popular'
  const initialSongId = params?.songId || undefined
  const initialFolder = params?.folder || undefined
  const initialSortOrder = (params?.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
  const view = (params?.view === 'table' ? 'table' : 'table') as 'gallery' | 'table'
  const easyChord = params?.easyChord === '1' || params?.easyChord === 'true'
  const capoParam = params?.capo as string | undefined
  const capoFilter = (capoParam === 'with' || capoParam === 'without' ? capoParam : 'any') as 'any' | 'with' | 'without'
  const likedOnly = params?.filter === 'liked'

  return (
    <Suspense fallback={<SongsSkeleton />}>
      <SongsDataWrapper
        page={page}
        limit={limit}
        q={q}
        tab={tab}
        view={view}
        initialSongId={initialSongId}
        initialFolder={initialFolder}
        initialSortOrder={initialSortOrder}
        easyChord={easyChord}
        capoFilter={capoFilter}
        likedOnly={likedOnly}
      />
    </Suspense>
  )
}

async function SongsDataWrapper({
  page,
  limit,
  q,
  tab,
  view,
  initialSongId,
  initialFolder,
  initialSortOrder,
  easyChord,
  capoFilter,
  likedOnly,
}: {
  page: number
  limit: number
  q: string
  tab: 'all' | 'recent' | 'popular'
  view: 'gallery' | 'table'
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
  easyChord?: boolean
  capoFilter?: 'any' | 'with' | 'without'
  likedOnly?: boolean
}) {
  const [songsData, playlistsData] = await Promise.all([
    SongsDataLoader({ page, limit, q, tab, initialSongId, initialFolder, initialSortOrder, easyChord, capoFilter, likedOnly }),
    PlaylistsDataLoader(),
  ])

  return (
    <SongsClient
      songs={songsData.songs}
      total={songsData.total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      initialTab={tab}
      playlists={playlistsData}
      initialSongId={initialSongId}
      initialFolder={initialFolder}
      initialSortOrder={initialSortOrder}
      initialEasyChord={easyChord}
      initialCapoFilter={capoFilter}
      likedOnly={likedOnly}
    />
  )
}

