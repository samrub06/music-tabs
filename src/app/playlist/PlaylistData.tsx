import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import PlaylistPageClient from './PlaylistPageClient'

async function SongsDataLoader() {
  const supabase = await createSafeServerClient()
  // Note: getAllSongs loads all songs with full content for playlist generation
  // This is necessary for the playlist generator to work with all song data
  const songs = await songRepo(supabase).getAllSongs()
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

