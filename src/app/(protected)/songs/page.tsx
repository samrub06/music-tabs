import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import SongsClient from './SongsClient'
import { songService } from '@/lib/services/songService'

export const dynamic = 'force-dynamic'

export default async function SongsPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; searchQuery?: string; songId?: string; folder?: string; sortOrder?: string }> }) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '10000', 10)) // Default to show all
  const view = (params?.view === 'table' ? 'table' : 'table') as 'gallery' | 'table' // Default to table
  const q = params?.searchQuery || ''
  const songId = params?.songId || undefined
  const folder = params?.folder || undefined
  const sortOrder = (params?.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'

  // Fetch data in parallel (songs are paginated + filtered)
  const [{ songs, total }, folders, playlists] = await Promise.all([
    songService.getAllSongs(supabase, page, limit, q),
    folderRepo(supabase).getAllFolders(),
    playlistRepo(supabase).getAllPlaylists()
  ])

  return (
    <SongsClient 
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      folders={folders}
      playlists={playlists}
      initialSongId={songId}
      initialFolder={folder}
      initialSortOrder={sortOrder}
    />
  )
}

