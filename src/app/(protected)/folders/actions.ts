'use server'

import { folderRepo } from '@/lib/services/folderRepo'
import { createActionServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateFolderOrderAction(folderId: string, newOrder: number) {
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.updateFolderOrder(folderId, newOrder)
  revalidatePath('/folders')
  revalidatePath('/dashboard')
  // Revalidate all folder detail pages
  revalidatePath('/folders', 'layout')
}
