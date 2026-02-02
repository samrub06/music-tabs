import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import AIPlaylistClient from './AIPlaylistClient'
import { unstable_noStore as noStore } from 'next/cache'

export default async function AIPlaylistPage() {
  noStore()
  
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()

  return <AIPlaylistClient folders={folders} />
}
