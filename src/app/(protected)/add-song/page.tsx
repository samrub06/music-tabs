import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import AddSongClient from './AddSongClient'
import { unstable_noStore as noStore } from 'next/cache'

export default async function AddSongPage() {
  noStore()
  
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()

  return <AddSongClient folders={folders} />
}
