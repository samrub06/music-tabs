import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch data in parallel
  const [songs, folders, playlists] = await Promise.all([
    songRepo(supabase).getAllSongs(),
    folderRepo(supabase).getAllFolders(),
    playlistRepo(supabase).getAllPlaylists()
  ])

  return (
    <DashboardClient 
      songs={songs}
      folders={folders}
      playlists={playlists}
      userEmail={user.email}
    />
  )
}
