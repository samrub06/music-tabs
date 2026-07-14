import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songService } from '@/lib/services/songService'
import { playlistRepo } from '@/lib/services/playlistRepo'
import SongsClient from './SongsClient'
import SongsPageSkeleton from '@/components/library/SongsPageSkeleton'
import type { Playlist } from '@/types'

type OrderByOption = 'created_at' | 'updated_at' | 'view_count'

export default async function SongsData({
  searchParams,
  userId,
}: {
  searchParams: Promise<{ page?: string; view?: string; limit?: string; searchQuery?: string; songId?: string; folder?: string; sortOrder?: string; tab?: string; easyChord?: string; capo?: string; filter?: string }>
  userId: string
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '50', 10))
  const tabParam = params?.tab as string | undefined
  const tab = (tabParam === 'recent' || tabParam === 'popular' ? tabParam : 'all') as 'all' | 'recent' | 'popular'
  const initialSongId = params?.songId || undefined
  const initialFolder = params?.folder || undefined
  const initialSortOrder = (params?.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const easyChord = params?.easyChord === '1' || params?.easyChord === 'true'
  const capoParam = params?.capo as string | undefined
  const capoFilter = (capoParam === 'with' || capoParam === 'without' ? capoParam : 'any') as 'any' | 'with' | 'without'
  const likedOnly = params?.filter === 'liked'

  const catalogKey = `${page}:${limit}:${tab}:${view}:${initialFolder ?? ''}:${initialSortOrder}:${easyChord}:${capoFilter}:${likedOnly}`

  return (
    <Suspense key={catalogKey} fallback={<SongsPageSkeleton view={view} />}>
      <SongsDataWrapper
        userId={userId}
        page={page}
        limit={limit}
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
  userId,
  page,
  limit,
  tab,
  view,
  initialSongId,
  initialFolder,
  initialSortOrder,
  easyChord,
  capoFilter,
  likedOnly,
}: {
  userId: string
  page: number
  limit: number
  tab: 'all' | 'recent' | 'popular'
  view: 'gallery' | 'table'
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

  const [songsData, playlistsLightweight, folderSongCountsMap] = await Promise.all([
    songService.getAllSongs(
      supabase,
      page,
      limit,
      '',
      orderBy,
      easyChord,
      capoFilter,
      likedOnly,
      folderId,
      userId
    ),
    playlistRepo(supabase).getAllPlaylistsLightweight(userId),
    folderRepo(supabase).getSongCountsByFolder(userId),
  ])

  const folderSongCounts = Object.fromEntries(folderSongCountsMap.entries())

  const playlistsData: Playlist[] = playlistsLightweight.map((p) => ({
    id: p.id,
    name: p.name,
    description: undefined,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
    songIds: [],
  }))

  return (
    <SongsClient
      songs={songsData.songs}
      total={songsData.total}
      page={page}
      limit={limit}
      initialView={view}
      initialTab={tab}
      playlists={playlistsData}
      initialSongId={initialSongId}
      initialFolder={initialFolder}
      initialSortOrder={initialSortOrder}
      initialEasyChord={easyChord}
      initialCapoFilter={capoFilter}
      likedOnly={likedOnly}
      folderSongCounts={folderSongCounts}
    />
  )
}
