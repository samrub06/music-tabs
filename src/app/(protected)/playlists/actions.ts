'use server'

import { folderRepo } from '@/lib/services/folderRepo'
import { createActionServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateFolderOrderAction(folderId: string, newOrder: number) {
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.updateFolderOrder(folderId, newOrder)
  revalidatePath('/playlists')
  // Revalidate all playlist detail pages
  revalidatePath('/playlists', 'layout')
}
