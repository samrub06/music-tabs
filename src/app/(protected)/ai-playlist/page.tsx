import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import AIPlaylistClient from './AIPlaylistClient'

export default async function AIPlaylistPage() {
  // Removed noStore() to allow Next.js caching - folders don't change frequently
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()

  return <AIPlaylistClient folders={folders} />
}
