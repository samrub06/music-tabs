import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import FoldersClient from './FoldersClient'

export const dynamic = 'force-dynamic'

export default async function FoldersPage() {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch folders and songs to count songs per folder
  const [folders, songs] = await Promise.all([
    folderRepo(supabase).getAllFolders(),
    songRepo(supabase).getAllSongs()
  ])

  // Count songs per folder
  const folderSongCounts = new Map<string, number>()
  songs.forEach(song => {
    const folderId = song.folderId || 'null'
    folderSongCounts.set(folderId, (folderSongCounts.get(folderId) || 0) + 1)
  })

  return (
    <FoldersClient 
      folders={folders}
      folderSongCounts={folderSongCounts}
    />
  )
}
