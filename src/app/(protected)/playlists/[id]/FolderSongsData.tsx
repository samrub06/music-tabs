import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songService } from '@/lib/services/songService'
import FolderSongsClient from './FolderSongsClient'
import type { PlaylistStripItem } from '@/components/playlists/PlaylistSwitcherStrip'
import type { Folder } from '@/types'

interface FolderSongsDataProps {
  folder: Folder
  page: number
  limit: number
  q: string
  sortOrder: 'asc' | 'desc'
  userId: string
}

export default async function FolderSongsData({
  folder,
  page,
  limit,
  q,
  sortOrder,
  userId,
}: FolderSongsDataProps) {
  const supabase = await createSafeServerClient()
  const repo = folderRepo(supabase)

  const [{ songs, total }, foldersLightweight, folderSongCounts] = await Promise.all([
    songService.getAllSongs(
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
    ),
    repo.getAllFoldersLightweight(userId),
    repo.getSongCountsByFolder(userId),
  ])

  const siblingPlaylists: PlaylistStripItem[] = foldersLightweight.map((f) => ({
    id: f.id,
    name: f.name,
    imageUrl: f.imageUrl,
    songCount: folderSongCounts.get(f.id) ?? 0,
  }))

  return (
    <FolderSongsClient
      folder={folder}
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialQuery={q}
      initialSortOrder={sortOrder}
      siblingPlaylists={siblingPlaylists}
    />
  )
}
