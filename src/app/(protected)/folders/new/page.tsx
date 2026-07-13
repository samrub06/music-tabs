import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import CreateFolderWizardClient from './CreateFolderWizardClient'

export default async function CreateFolderPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [folders, songs] = await Promise.all([
    folderRepo(supabase).getAllFolders(),
    songRepo(supabase).getAllSongsForPlaylist(),
  ])

  return (
    <CreateFolderWizardClient
      existingNames={folders.map((folder) => folder.name)}
      songs={songs.map((song) => ({
        id: song.id,
        title: song.title,
        author: song.author,
        genre: song.genre ?? null,
      }))}
    />
  )
}
