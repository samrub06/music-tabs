import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import FolderSongsClient from './FolderSongsClient'
import type { Folder } from '@/types'

interface FolderSongsDataProps {
  folder: Folder
  page: number
  limit: number
  view: 'gallery' | 'table'
  q: string
  sortOrder: 'asc' | 'desc'
  userId: string
}

export default async function FolderSongsData({
  folder,
  page,
  limit,
  view,
  q,
  sortOrder,
  userId,
}: FolderSongsDataProps) {
  const supabase = await createSafeServerClient()
  const { songs, total } = await songRepo(supabase).getSongsByFolder(
    folder.id,
    page,
    limit,
    q,
    userId
  )

  return (
    <FolderSongsClient
      folder={folder}
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      initialSortOrder={sortOrder}
    />
  )
}
