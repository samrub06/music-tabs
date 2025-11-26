import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
import { folderService } from '@/lib/services/folderService'
import { playlistService } from '@/lib/services/playlistService'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch data in parallel
  const [songsResult, folders, playlists] = await Promise.all([
    songService.getAllSongs(supabase),
    folderService.getAllFolders(supabase),
    playlistService.getAllPlaylists(supabase)
  ])

  return (
    <DashboardClient 
      songs={songsResult.songs}
      folders={folders}
      playlists={playlists}
      userEmail={user.email}
    />
  )
}
