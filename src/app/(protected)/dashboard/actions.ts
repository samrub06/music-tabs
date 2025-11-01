'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { songService, folderService } from '@/lib/services/songService'
import { playlistService } from '@/lib/services/playlistService'
import { revalidatePath } from 'next/cache'
import type { NewSongData, SongEditData, Folder } from '@/types'
import type { MedleyResult } from '@/lib/services/medleyService'

async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}

export async function addSongAction(payload: NewSongData) {
  const supabase = await supabaseServer()
  const created = await songService.createSong(payload, supabase)
  revalidatePath('/dashboard')
  return created
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const supabase = await supabaseServer()
  const updated = await songService.updateSong(id, updates, supabase)
  revalidatePath('/dashboard')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function updateSongFolderAction(id: string, folderId?: string) {
  const supabase = await supabaseServer()
  await songService.updateSongFolder(id, folderId, supabase)
  revalidatePath('/dashboard')
}

export async function deleteSongsAction(ids: string[]) {
  const supabase = await supabaseServer()
  await songService.deleteSongs(ids, supabase)
  revalidatePath('/dashboard')
}

export async function deleteAllSongsAction() {
  const supabase = await supabaseServer()
  await songService.deleteAllSongs(supabase)
  revalidatePath('/dashboard')
}

export async function deleteSongAction(id: string) {
  const supabase = await supabaseServer()
  await songService.deleteSong(id, supabase)
  revalidatePath('/dashboard')
}

export async function addFolderAction(name: string) {
  const supabase = await supabaseServer()
  await folderService.createFolder({ name }, supabase)
  revalidatePath('/dashboard')
}

export async function renameFolderAction(id: string, name: string) {
  const supabase = await supabaseServer()
  await folderService.updateFolder(id, { name }, supabase)
  revalidatePath('/dashboard')
}

export async function deleteFolderAction(id: string) {
  const supabase = await supabaseServer()
  await folderService.deleteFolder(id, supabase)
  revalidatePath('/dashboard')
}

export async function createPlaylistFromMedleyAction(name: string, medley: MedleyResult) {
  const supabase = await supabaseServer()
  const playlist = await playlistService.createPlaylistFromMedley(name, medley, undefined, supabase)
  revalidatePath('/dashboard')
  return playlist
}

