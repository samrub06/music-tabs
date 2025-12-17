import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import DashboardClient from './DashboardClient'
import { songService } from '@/lib/services/songService'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string }> }) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '50', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''

  // Fetch data in parallel (songs are paginated + filtered)
  const [{ songs, total }, folders, playlists] = await Promise.all([
    songService.getAllSongs(supabase, page, limit, q),
    folderRepo(supabase).getAllFolders(),
    playlistRepo(supabase).getAllPlaylists()
  ])

  return (
    <DashboardClient 
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      folders={folders}
      playlists={playlists}
      userEmail={user.email}
    />
  )
}
