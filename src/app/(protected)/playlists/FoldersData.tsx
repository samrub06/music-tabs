import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { getCachedLibraryCatalogSections } from '@/lib/services/libraryCatalogCache'
import FoldersClient from './FoldersClient'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import type { Folder } from '@/types'

interface FoldersDataProps {
  userId: string
}

export default async function FoldersData({ userId }: FoldersDataProps) {
  const supabase = await createSafeServerClient()
  const repo = folderRepo(supabase)

  const [foldersLightweight, folderSongCounts, catalog] = await Promise.all([
    repo.getAllFoldersLightweight(userId),
    repo.getSongCountsByFolder(userId),
    getCachedLibraryCatalogSections(),
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

  const explorerPlaylists: PublicPlaylistItem[] = catalog.publicPlaylists
    .filter((p) => p.songCount > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      songCount: p.songCount,
      curatedSlug: p.curatedSlug,
    }))

  return (
    <FoldersClient
      folders={folders}
      folderSongCounts={folderSongCounts}
      explorerPlaylists={explorerPlaylists}
    />
  )
}
