import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import DashboardClient from './DashboardClient'

async function SongsDataLoader({
  page,
  limit,
  q,
}: {
  page: number
  limit: number
  q: string
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

async function UserDataLoader() {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || ''
}

export default async function DashboardData({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '50', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''

  // Stream all data in parallel
  const [songsData, folders, playlists, userEmail] = await Promise.all([
    SongsDataLoader({ page, limit, q }),
    FoldersDataLoader(),
    PlaylistsDataLoader(),
    UserDataLoader(),
  ])

  return (
    <DashboardClient
      songs={songsData.songs}
      total={songsData.total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      folders={folders}
      playlists={playlists}
      userEmail={userEmail}
    />
  )
}

