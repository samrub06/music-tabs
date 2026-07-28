'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { songService } from '@/lib/services/songService'
import { folderService } from '@/lib/services/folderService'
import { songRepo } from '@/lib/services/songRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistService } from '@/lib/services/playlistService'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import { revalidatePath } from 'next/cache'
import type { NewSongData, SongEditData, Folder, Song } from '@/types'
import type { PlaylistResult } from '@/lib/services/playlistGeneratorService'
import { createActionServerClient } from '@/lib/supabase/server'
import { assertCanDeleteSong, assertCanEditSong } from '@/lib/services/songPermissions'
import { renderStructuredSong } from '@/utils/structuredSong'
import {
  createSongSchema,
  updateSongSchema,
  createFolderSchema,
  createFolderWithSongsSchema,
  assignSongsToFolderSchema,
  updateFolderSchema,
  createPlaylistSchema,
  selectableSongIdsSchema,
} from '@/lib/validation/schemas'
import { resolvePlaylistImageUrl } from '@/utils/playlistCover'
import { userLibraryRepo } from '@/lib/services/userLibraryRepo'
import { classifyLibraryMembership } from '@/lib/utils/libraryMembership'

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
  
  // Award XP for creating song
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const gamification = gamificationRepo(supabase)
    try {
      await gamification.awardXp(user.id, 50, 'create_song', created.id)
      await gamification.incrementCounter(user.id, 'total_songs_created')
      await gamification.checkAndAwardBadges(user.id)
    } catch (error) {
      // Log but don't fail the action if gamification fails
      console.error('Error awarding XP for song creation:', error)
    }
  }
  
  revalidatePath('/songs')
  revalidatePath('/')
  return created
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const validatedUpdates = updateSongSchema.parse(updates)
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  const existing = await repo.getSong(id)
  if (!existing) throw new Error('Song not found')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  // Catalog song edit → fork personal copy, retarget library link
  if (!existing.userId) {
    const forked = await repo.createSong({
      title: existing.title,
      author: existing.author,
      content: existing.content || renderStructuredSong(existing),
      folderId: existing.folderId,
      reviews: existing.reviews,
      capo: existing.capo,
      key: existing.key,
      soundingKey: existing.soundingKey,
      firstChord: existing.firstChord,
      lastChord: existing.lastChord,
      chordProgression: existing.chordProgression,
      version: existing.version,
      versionDescription: existing.versionDescription,
      rating: existing.rating,
      difficulty: existing.difficulty,
      artistUrl: existing.artistUrl,
      artistImageUrl: existing.artistImageUrl,
      songImageUrl: existing.songImageUrl,
      sourceUrl: existing.sourceUrl,
      sourceSite: existing.sourceSite,
      tabId: existing.tabId,
      genre: existing.genre,
      bpm: existing.bpm,
      clonedFromId: existing.id,
    })

    try {
      const { userLibraryRepo } = await import('@/lib/services/userLibraryRepo')
      const lib = userLibraryRepo(supabase)
      const entry = await lib.getByUserAndSong(user.id, id)
      if (entry) {
        await lib.retargetSong(entry.id, forked.id)
      } else {
        await lib.add({ userId: user.id, songId: forked.id, folderId: existing.folderId })
      }
    } catch (error) {
      console.warn('user_library retarget after fork failed:', error)
    }

    const normalizedUpdates: SongEditData = {
      ...validatedUpdates,
      folderId: validatedUpdates.folderId ?? undefined,
    }
    const updated = await repo.updateSong(forked.id, normalizedUpdates)
    revalidatePath('/songs')
    revalidatePath('/')
    revalidatePath(`/song/${forked.id}`)
    return updated
  }

  await assertCanEditSong(supabase, id)
  const normalizedUpdates: SongEditData = {
    ...validatedUpdates,
    folderId: validatedUpdates.folderId ?? undefined
  }
  const updated = await repo.updateSong(id, normalizedUpdates)

  const gamification = gamificationRepo(supabase)
  try {
    await gamification.awardXp(user.id, 10, 'edit_song', id)
  } catch (error) {
    console.error('Error awarding XP for song edit:', error)
  }

  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function updateSongFolderAction(id: string, folderId?: string) {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const repo = songRepo(supabase)
  const song = await repo.getSong(id)
  if (!song) throw new Error('Song not found')

  const lib = userLibraryRepo(supabase)
  let hasLibraryLink = false
  try {
    hasLibraryLink = Boolean(await lib.getByUserAndSong(user.id, id))
  } catch {
    hasLibraryLink = false
  }

  const kind = classifyLibraryMembership({
    songUserId: song.userId,
    currentUserId: user.id,
    hasLibraryLink,
  })

  let result: Song
  if (kind === 'personal') {
    result = await repo.updateSongFolder(id, folderId)
  } else if (kind === 'library_link') {
    const entry = await lib.getByUserAndSong(user.id, id)
    if (!entry) throw new Error('Song not in library')
    const updated = await lib.updateFolder(entry.id, folderId ?? null)
    result = { ...song, folderId: updated.folderId }
  } else {
    throw new Error('Song not in library')
  }

  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/song/${id}`)
  return result
}

export async function getSelectableSongIdsAction(payload: unknown): Promise<string[]> {
  const filters = selectableSongIdsSchema.parse(payload)
  const supabase = await createActionServerClient()

  if (filters.scopeFolderId) {
    return songService.getAllSongIds(supabase, {
      q: filters.q,
      folderId: filters.scopeFolderId,
    })
  }

  return songService.getAllSongIds(supabase, {
    q: filters.q,
    tab: filters.tab,
    easyChord: filters.easyChord,
    capoFilter: filters.capoFilter,
    likedOnly: filters.likedOnly,
    folderId: filters.folderId,
  })
}

export async function deleteSongsAction(ids: string[]) {
  if (!Array.isArray(ids)) throw new Error('Invalid input')
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === 'string')))
  if (uniqueIds.length === 0) return

  const repo = songRepo(supabase)
  const { data: rows, error } = await (supabase.from('songs') as any)
    .select('id, user_id')
    .in('id', uniqueIds)
  if (error) throw error

  const ownedIds = new Set<string>()
  for (const row of (rows as Array<{ id: string; user_id: string | null }>) || []) {
    if (row.user_id === user.id) ownedIds.add(row.id)
  }

  const personalIds = uniqueIds.filter((id) => ownedIds.has(id))
  const linkIds = uniqueIds.filter((id) => !ownedIds.has(id))

  if (personalIds.length > 0) {
    await repo.deleteSongs(personalIds)
  }
  if (linkIds.length > 0) {
    try {
      await userLibraryRepo(supabase).removeBySongIds(user.id, linkIds)
    } catch (unlinkError) {
      console.warn('user_library unlink failed:', unlinkError)
      throw unlinkError
    }
  }

  revalidatePath('/songs')
  revalidatePath('/')
}

export async function deleteAllSongsAction() {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const repo = songRepo(supabase)
  await repo.deleteAllSongs()
  try {
    await userLibraryRepo(supabase).removeAllForUser(user.id)
  } catch (error) {
    console.warn('user_library removeAllForUser failed:', error)
  }
  revalidatePath('/songs')
  revalidatePath('/')
}

export async function deleteSongAction(id: string) {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const repo = songRepo(supabase)
  const song = await repo.getSong(id)
  if (!song) throw new Error('Song not found')

  const lib = userLibraryRepo(supabase)
  let hasLibraryLink = false
  try {
    hasLibraryLink = Boolean(await lib.getByUserAndSong(user.id, id))
  } catch {
    hasLibraryLink = false
  }

  const kind = classifyLibraryMembership({
    songUserId: song.userId,
    currentUserId: user.id,
    hasLibraryLink,
  })

  if (kind === 'personal') {
    await assertCanDeleteSong(supabase, id)
    await repo.deleteSong(id)
  } else if (kind === 'library_link') {
    await lib.remove(user.id, id)
  } else {
    throw new Error('You do not have permission to delete this song')
  }

  revalidatePath('/songs')
  revalidatePath('/')
}

export async function addFolderAction(name: string, coverSlug?: string, songIds?: string[]) {
  const {
    name: validatedName,
    coverSlug: validatedCoverSlug,
    songIds: validatedSongIds,
  } = createFolderWithSongsSchema.parse({
    name,
    coverSlug,
    songIds: songIds ?? [],
  })
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  const created = await repo.createFolder({
    name: validatedName,
    coverSlug: validatedCoverSlug,
  })

  if (validatedSongIds.length > 0) {
    await songRepo(supabase).assignSongsToFolder(created.id, validatedSongIds)
  }

  // Award XP for creating folder
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const gamification = gamificationRepo(supabase)
    try {
      await gamification.awardXp(user.id, 20, 'create_folder', created.id)
      await gamification.incrementCounter(user.id, 'total_folders_created')
      await gamification.checkAndAwardBadges(user.id)
    } catch (error) {
      console.error('Error awarding XP for folder creation:', error)
    }
  }

  revalidatePath('/playlists')
  revalidatePath('/songs')
  revalidatePath('/')
  return created
}

/** Assign a chunk of songs to an existing playlist (folder). Used for progressive create UI. */
export async function assignSongsToFolderAction(folderId: string, songIds: string[]) {
  const {
    folderId: validatedFolderId,
    songIds: validatedSongIds,
  } = assignSongsToFolderSchema.parse({ folderId, songIds })

  const supabase = await createActionServerClient()
  const folders = folderRepo(supabase)
  const folder = await folders.getFolderById(validatedFolderId)
  if (!folder) {
    throw new Error('FOLDER_NOT_FOUND')
  }

  const updated = await songRepo(supabase).assignSongsToFolder(
    validatedFolderId,
    validatedSongIds
  )

  revalidatePath('/playlists')
  revalidatePath(`/playlists/${validatedFolderId}`)
  revalidatePath('/songs')
  revalidatePath('/')
  return { updated }
}

export async function renameFolderAction(id: string, name: string) {
  const { name: validatedName } = updateFolderSchema.parse({ name })
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.updateFolder(id, { name: validatedName })
  revalidatePath('/playlists')
  revalidatePath('/playlists', 'layout')
}

export async function deleteFolderAction(id: string) {
  const supabase = await createActionServerClient()
  const repo = folderRepo(supabase)
  await repo.deleteFolder(id)
  revalidatePath('/playlists')
  revalidatePath('/playlists', 'layout')
}

export async function createPlaylistAction(name: string, coverSlug?: string) {
  const { name: validatedName, coverSlug: validatedCoverSlug } = createPlaylistSchema.parse({ name, coverSlug })
  const supabase = await createActionServerClient()
  const imageUrl = resolvePlaylistImageUrl({ name: validatedName, coverSlug: validatedCoverSlug })
  const created = await playlistService.createPlaylist(validatedName, undefined, [], supabase, imageUrl)
  
  // Award XP for creating playlist
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const gamification = gamificationRepo(supabase)
    try {
      await gamification.awardXp(user.id, 30, 'create_playlist', created.id)
      await gamification.incrementCounter(user.id, 'total_playlists_created')
      await gamification.checkAndAwardBadges(user.id)
    } catch (error) {
      console.error('Error awarding XP for playlist creation:', error)
    }
  }
  
  revalidatePath('/jams')
  return created
}

export async function createPlaylistFromGeneratedPlaylistAction(
  name: string,
  playlist: PlaylistResult,
  coverSlug?: string,
  genreId?: string
) {
  const { name: validatedName, coverSlug: validatedCoverSlug } = createPlaylistSchema.parse({ name, coverSlug })
  const supabase = await createActionServerClient()
  const imageUrl = resolvePlaylistImageUrl({
    name: validatedName,
    coverSlug: validatedCoverSlug,
    genreId,
    songs: playlist.songs,
  })
  const savedPlaylist = await playlistService.createPlaylistFromGeneratedPlaylist(
    validatedName,
    playlist,
    undefined,
    supabase,
    imageUrl
  )
  revalidatePath('/jams')
  return savedPlaylist
}

export async function cloneSongAction(songId: string, targetFolderId?: string) {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)

  const sourceSong = await repo.getSong(songId)
  if (!sourceSong) {
    throw new Error('Song not found')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  const isCatalogSource = !sourceSong.userId || sourceSong.isPublic === true

  // Prefer library link for catalog songs (no content clone)
  if (isCatalogSource && !sourceSong.userId) {
    const { addSongToUserLibrary } = await import('@/lib/services/userLibraryRepo')
    try {
      const { song } = await addSongToUserLibrary(supabase, {
        userId: user.id,
        songId: sourceSong.id,
        folderId: targetFolderId,
      })
      const gamification = gamificationRepo(supabase)
      try {
        await gamification.awardXp(user.id, 15, 'clone_song', song.id)
      } catch (error) {
        console.error('Error awarding XP for library link:', error)
      }
      revalidatePath('/songs')
      revalidatePath('/')
      return song
    } catch (error) {
      // Table may not exist yet — fall through to legacy clone
      console.warn('user_library link failed, falling back to clone:', error)
    }
  }

  const newSongData: NewSongData = {
    title: sourceSong.title,
    author: sourceSong.author,
    content: sourceSong.content || renderStructuredSong(sourceSong),
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
    bpm: sourceSong.bpm,
    clonedFromId: isCatalogSource ? sourceSong.id : sourceSong.clonedFromId,
  }

  const created = await repo.createSong(newSongData)

  const gamification = gamificationRepo(supabase)
  try {
    await gamification.awardXp(user.id, 15, 'clone_song', created.id)
  } catch (error) {
    console.error('Error awarding XP for song clone:', error)
  }

  revalidatePath('/songs')
  revalidatePath('/')
  return created
}
