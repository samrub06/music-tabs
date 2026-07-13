import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import FoldersClient from './FoldersClient'
import type { Folder } from '@/types'

interface FoldersDataProps {
  userId: string
}

export default async function FoldersData({ userId }: FoldersDataProps) {
  const supabase = await createSafeServerClient()
  const repo = folderRepo(supabase)

  const [foldersLightweight, folderSongCounts] = await Promise.all([
    repo.getAllFoldersLightweight(userId),
    repo.getSongCountsByFolder(userId),
  ])

  const folders: Folder[] = foldersLightweight.map((f) => ({
    id: f.id,
    name: f.name,
    displayOrder: f.displayOrder,
    imageUrl: f.imageUrl,
    parentId: undefined,
    createdAt: f.createdAt,
    updatedAt: f.createdAt,
  }))

  return <FoldersClient folders={folders} folderSongCounts={folderSongCounts} />
}
