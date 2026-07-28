import { createSafeServerClient } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
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
  const { songs, total } = await songService.getAllSongs(
    supabase,
    page,
    limit,
    q || undefined,
    'created_at',
    undefined,
    undefined,
    undefined,
    folder.id,
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
