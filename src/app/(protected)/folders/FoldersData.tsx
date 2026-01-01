import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import FoldersClient from './FoldersClient'

async function FoldersDataLoader() {
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()
  return folders
}

async function SongCountsDataLoader() {
  const supabase = await createSafeServerClient()
  const folderSongCounts = await folderRepo(supabase).getSongCountsByFolder()
  return folderSongCounts
}

export default async function FoldersData() {
  // Stream both data sources in parallel
  const [folders, folderSongCounts] = await Promise.all([
    FoldersDataLoader(),
    SongCountsDataLoader(),
  ])

  return (
    <FoldersClient
      folders={folders}
      folderSongCounts={folderSongCounts}
    />
  )
}

