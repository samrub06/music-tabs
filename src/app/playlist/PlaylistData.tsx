import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import PlaylistPageClient from './PlaylistPageClient'

async function SongsDataLoader() {
  const supabase = await createSafeServerClient()
  // Use lightweight method - playlist generator only needs metadata, not full song content
  const songs = await songRepo(supabase).getAllSongsForPlaylist()
  return songs
}

async function FoldersDataLoader() {
  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()
  return folders
}

export default async function PlaylistData() {
  // Stream both data sources in parallel
  const [songs, folders] = await Promise.all([
    SongsDataLoader(),
    FoldersDataLoader(),
  ])

  return (
    <PlaylistPageClient
      songs={songs}
      folders={folders}
    />
  )
}


