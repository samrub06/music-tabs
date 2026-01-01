import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import SongsClient from './SongsClient'

async function SongsDataLoader({
  page,
  limit,
  q,
  initialSongId,
  initialFolder,
  initialSortOrder,
}: {
  page: number
  limit: number
  q: string
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
}) {
  const supabase = await createSafeServerClient()
  const { songs, total } = await songService.getAllSongs(supabase, page, limit, q)
  return { songs, total }
}

async function FoldersDataLoader() {
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()
  return folders
}

async function PlaylistsDataLoader() {
  const supabase = await createSafeServerClient()
  const playlists = await playlistRepo(supabase).getAllPlaylists()
  return playlists
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

function FoldersSkeleton() {
  return (
    <div className="h-10 bg-gray-100 rounded w-48 animate-pulse"></div>
  )
}

function PlaylistsSkeleton() {
  return (
    <div className="h-10 bg-gray-100 rounded w-32 animate-pulse"></div>
  )
}

export default async function SongsData({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; limit?: string; searchQuery?: string; songId?: string; folder?: string; sortOrder?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '100', 10))
  const q = params?.searchQuery || ''
  const initialSongId = params?.songId || undefined
  const initialFolder = params?.folder || undefined
  const initialSortOrder = (params?.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
  const view = (params?.view === 'table' ? 'table' : 'table') as 'gallery' | 'table'

  return (
    <Suspense fallback={<SongsSkeleton />}>
      <SongsDataWrapper
        page={page}
        limit={limit}
        q={q}
        view={view}
        initialSongId={initialSongId}
        initialFolder={initialFolder}
        initialSortOrder={initialSortOrder}
      />
    </Suspense>
  )
}

async function SongsDataWrapper({
  page,
  limit,
  q,
  view,
  initialSongId,
  initialFolder,
  initialSortOrder,
}: {
  page: number
  limit: number
  q: string
  view: 'gallery' | 'table'
  initialSongId?: string
  initialFolder?: string
  initialSortOrder?: 'asc' | 'desc'
}) {
  // Stream all data in parallel with Suspense
  const [songsData, foldersData, playlistsData] = await Promise.all([
    SongsDataLoader({ page, limit, q, initialSongId, initialFolder, initialSortOrder }),
    FoldersDataLoader(),
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
      folders={foldersData}
      playlists={playlistsData}
      initialSongId={initialSongId}
      initialFolder={initialFolder}
      initialSortOrder={initialSortOrder}
    />
  )
}

