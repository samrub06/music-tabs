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
import type { PlaylistResult } from '@/lib/services/playlistGeneratorService'
import { createActionServerClient } from '@/lib/supabase/server'
import { createSongSchema, updateSongSchema, createFolderSchema, updateFolderSchema, createPlaylistSchema } from '@/lib/validation/schemas'

export async function addSongAction(payload: NewSongData) {
  const validatedPayload = createSongSchema.parse(payload)
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  
  // Vérifier si tabId est présent et si une chanson avec ce tabId existe déjà
  if (validatedPayload.tabId) {
    const existingSong = await repo.getSongByTabId(validatedPayload.tabId)
    if (existingSong) {
      throw new Error('Cette chanson existe déjà dans votre bibliothèque')
    }
  }

  // Auto-organization logic: if no folderId provided but genre exists, find or create genre folder
  let finalFolderId = validatedPayload.folderId ?? undefined
  
  if (!finalFolderId && validatedPayload.genre) {
    const genreName = validatedPayload.genre.trim()
    if (genreName) {
      const fRepo = folderRepo(supabase)
      const folders = await fRepo.getAllFolders()
      
      // Check for existing folder (case-insensitive)
      const existingFolder = folders.find(f => f.name.toLowerCase() === genreName.toLowerCase())
      
      if (existingFolder) {
        finalFolderId = existingFolder.id
      } else {
        // Create new folder for this genre
        try {
          const newFolder = await fRepo.createFolder({ name: genreName })
          finalFolderId = newFolder.id
        } catch (error) {
          console.error('Failed to auto-create genre folder:', error)
          // Fallback to no folder if creation fails
        }
      }
    }
  }
  
  const normalizedPayload: NewSongData = {
    ...validatedPayload,
    folderId: finalFolderId
  }
  const created = await repo.createSong(normalizedPayload)
  revalidatePath('/dashboard')
  return created
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const validatedUpdates = updateSongSchema.parse(updates)
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  const normalizedUpdates: SongEditData = {
    ...validatedUpdates,
    folderId: validatedUpdates.folderId ?? undefined
  }
  const updated = await repo.updateSong(id, normalizedUpdates)
  revalidatePath('/dashboard')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function updateSongFolderAction(id: string, folderId?: string) {
  // Simple ID validation could be added here, but folderId is optional/nullable
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.updateSongFolder(id, folderId)
  revalidatePath('/dashboard')
}

export async function deleteSongsAction(ids: string[]) {
  // Simple validation for array of strings
  if (!Array.isArray(ids)) throw new Error('Invalid input')
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.deleteSongs(ids)
  revalidatePath('/dashboard')
}

export async function deleteAllSongsAction() {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.deleteAllSongs()
  revalidatePath('/dashboard')
}

export async function deleteSongAction(id: string) {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.deleteSong(id)
  revalidatePath('/dashboard')
}

export async function addFolderAction(name: string) {
  const { name: validatedName } = createFolderSchema.parse({ name })
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.createFolder({ name: validatedName })
  revalidatePath('/dashboard')
  revalidatePath('/folders')
}

export async function renameFolderAction(id: string, name: string) {
  const { name: validatedName } = updateFolderSchema.parse({ name })
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.updateFolder(id, { name: validatedName })
  revalidatePath('/dashboard')
  revalidatePath('/folders')
  revalidatePath('/folders', 'layout')
}

export async function deleteFolderAction(id: string) {
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.deleteFolder(id)
  revalidatePath('/dashboard')
  revalidatePath('/folders')
  revalidatePath('/folders', 'layout')
}

export async function createPlaylistAction(name: string) {
  const { name: validatedName } = createPlaylistSchema.parse({ name })
  const supabase = await createActionServerClient()
  const created = await playlistService.createPlaylist(validatedName, undefined, [], supabase)
  revalidatePath('/dashboard')
  revalidatePath('/playlists')
  return created
}

export async function createPlaylistFromGeneratedPlaylistAction(name: string, playlist: PlaylistResult) {
  const { name: validatedName } = createPlaylistSchema.parse({ name })
  const supabase = await createActionServerClient()
  const savedPlaylist = await playlistService.createPlaylistFromGeneratedPlaylist(validatedName, playlist, undefined, supabase)
  revalidatePath('/dashboard')
  return savedPlaylist
}

export async function cloneSongAction(songId: string, targetFolderId?: string) {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  
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
    tabId: sourceSong.tabId,
    genre: sourceSong.genre,
    bpm: sourceSong.bpm
  }
  
  const created = await repo.createSong(newSongData)
  revalidatePath('/dashboard')
  return created
}
