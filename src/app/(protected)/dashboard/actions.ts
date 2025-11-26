'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { songService } from '@/lib/services/songService'
import { folderService } from '@/lib/services/folderService'
import { songRepo } from '@/lib/services/songRepo'
import { playlistService } from '@/lib/services/playlistService'
import { revalidatePath } from 'next/cache'
import type { NewSongData, SongEditData, Folder } from '@/types'
import type { MedleyResult } from '@/lib/services/medleyService'
import { createServerClientSupabase } from '@/lib/supabase/server'

export async function addSongAction(payload: NewSongData) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  const created = await repo.createSong(payload)
  revalidatePath('/dashboard')
  return created
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  const updated = await repo.updateSong(id, updates)
  revalidatePath('/dashboard')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function updateSongFolderAction(id: string, folderId?: string) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  await repo.updateSongFolder(id, folderId)
  revalidatePath('/dashboard')
}

export async function deleteSongsAction(ids: string[]) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  await repo.deleteSongs(ids)
  revalidatePath('/dashboard')
}

export async function deleteAllSongsAction() {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  await repo.deleteAllSongs()
  revalidatePath('/dashboard')
}

export async function deleteSongAction(id: string) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  await repo.deleteSong(id)
  revalidatePath('/dashboard')
}

export async function addFolderAction(name: string) {
  const supabase = await createServerClientSupabase()
  await folderService.createFolder({ name }, supabase)
  revalidatePath('/dashboard')
}

export async function renameFolderAction(id: string, name: string) {
  const supabase = await createServerClientSupabase()
  await folderService.updateFolder(id, { name }, supabase)
  revalidatePath('/dashboard')
}

export async function deleteFolderAction(id: string) {
  const supabase = await createServerClientSupabase()
  await folderService.deleteFolder(id, supabase)
  revalidatePath('/dashboard')
}

export async function createPlaylistFromMedleyAction(name: string, medley: MedleyResult) {
  const supabase = await createServerClientSupabase()
  const playlist = await playlistService.createPlaylistFromMedley(name, medley, undefined, supabase)
  revalidatePath('/dashboard')
  return playlist
}

