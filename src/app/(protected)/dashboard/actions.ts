'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { songService } from '@/lib/services/songService'
import { folderService } from '@/lib/services/folderService'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistService } from '@/lib/services/playlistService'
import { revalidatePath } from 'next/cache'
import type { NewSongData, SongEditData, Folder } from '@/types'
import type { MedleyResult } from '@/lib/services/medleyService'
import { createServerClientSupabase } from '@/lib/supabase/server'
import { createSongSchema, updateSongSchema, createFolderSchema, updateFolderSchema, createPlaylistSchema } from '@/lib/validation/schemas'

export async function addSongAction(payload: NewSongData) {
  const validatedPayload = createSongSchema.parse(payload)
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  const created = await repo.createSong(validatedPayload)
  revalidatePath('/dashboard')
  return created
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const validatedUpdates = updateSongSchema.parse(updates)
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  const updated = await repo.updateSong(id, validatedUpdates)
  revalidatePath('/dashboard')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function updateSongFolderAction(id: string, folderId?: string) {
  // Simple ID validation could be added here, but folderId is optional/nullable
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  await repo.updateSongFolder(id, folderId)
  revalidatePath('/dashboard')
}

export async function deleteSongsAction(ids: string[]) {
  // Simple validation for array of strings
  if (!Array.isArray(ids)) throw new Error('Invalid input')
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
  const { name: validatedName } = createFolderSchema.parse({ name })
  const supabase = await createServerClientSupabase()
  const repo = folderRepo(supabase as any)
  await repo.createFolder({ name: validatedName })
  revalidatePath('/dashboard')
}

export async function renameFolderAction(id: string, name: string) {
  const { name: validatedName } = updateFolderSchema.parse({ name })
  const supabase = await createServerClientSupabase()
  const repo = folderRepo(supabase as any)
  await repo.updateFolder(id, { name: validatedName })
  revalidatePath('/dashboard')
}

export async function deleteFolderAction(id: string) {
  const supabase = await createServerClientSupabase()
  const repo = folderRepo(supabase as any)
  await repo.deleteFolder(id)
  revalidatePath('/dashboard')
}

export async function createPlaylistFromMedleyAction(name: string, medley: MedleyResult) {
  const { name: validatedName } = createPlaylistSchema.parse({ name })
  const supabase = await createServerClientSupabase()
  const playlist = await playlistService.createPlaylistFromMedley(validatedName, medley, undefined, supabase)
  revalidatePath('/dashboard')
  return playlist
}

export async function cloneSongAction(songId: string, targetFolderId?: string) {
  const supabase = await createServerClientSupabase()
  const repo = songRepo(supabase as any)
  
  // 1. Fetch source song (assuming RLS allows reading public/trending songs)
  const sourceSong = await repo.getSong(songId)
  
  if (!sourceSong) {
    throw new Error('Song not found')
  }
  
  // 2. Create new song for current user
  const newSongData: NewSongData = {
    title: sourceSong.title,
    author: sourceSong.author,
    content: sourceSong.content,
    folderId: targetFolderId,
    reviews: sourceSong.reviews,
    capo: sourceSong.capo,
    key: sourceSong.key,
    soundingKey: sourceSong.soundingKey,
    firstChord: sourceSong.firstChord,
    lastChord: sourceSong.lastChord,
    chordProgression: sourceSong.chordProgression,
    version: sourceSong.version,
    versionDescription: sourceSong.versionDescription,
    rating: sourceSong.rating,
    difficulty: sourceSong.difficulty,
    artistUrl: sourceSong.artistUrl,
    artistImageUrl: sourceSong.artistImageUrl,
    songImageUrl: sourceSong.songImageUrl,
    sourceUrl: sourceSong.sourceUrl,
    sourceSite: sourceSong.sourceSite,
    tabId: sourceSong.tabId
  }
  
  const created = await repo.createSong(newSongData)
  revalidatePath('/dashboard')
  return created
}
