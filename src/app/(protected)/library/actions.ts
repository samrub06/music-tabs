'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActionServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import { renderStructuredSong } from '@/utils/structuredSong'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'
import type { NewSongData } from '@/types'

const savePublicPlaylistAsFolderSchema = z.object({
  playlistId: z.string().uuid(),
})

const MAX_SONGS_TO_IMPORT = 80

async function resolveUniqueFolderName(
  repo: ReturnType<typeof folderRepo>,
  baseName: string
): Promise<string> {
  const trimmed = baseName.trim() || 'Playlist'
  if (!(await repo.findFolderByName(trimmed))) return trimmed

  for (let i = 2; i <= 99; i += 1) {
    const candidate = `${trimmed} (${i})`
    if (!(await repo.findFolderByName(candidate))) return candidate
  }

  return `${trimmed} ${Date.now()}`
}

/**
 * Saves a public/curated explorer playlist into the user's Playlists page (/playlists).
 * Creates a folder with the playlist cover, then imports songs (reuse existing library matches).
 */
export async function savePublicPlaylistAsFolderAction(playlistId: string) {
  const { playlistId: validatedId } = savePublicPlaylistAsFolderSchema.parse({ playlistId })
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('AUTH_REQUIRED')
  }

  const plRepo = playlistRepo(supabase)
  const fRepo = folderRepo(supabase)
  const sRepo = songRepo(supabase)

  const playlist = await plRepo.getPublicPlaylist(validatedId)
  const folderName = await resolveUniqueFolderName(fRepo, playlist.name)
  const coverUrl =
    playlist.imageUrl ||
    (playlist.curatedSlug ? getCuratedPlaylistCoverUrl(playlist.curatedSlug) : null) ||
    undefined
  const folder = await fRepo.createFolder({
    name: folderName,
    imageUrl: coverUrl,
  })

  const songIds = playlist.songIds.slice(0, MAX_SONGS_TO_IMPORT)
  const userSongs = await sRepo.getAllSongsLightweight()
  let imported = 0
  let reused = 0

  for (const songId of songIds) {
    const sourceSong = await sRepo.getSong(songId)
    if (!sourceSong) continue

    const existing = findUserSongMatch(sourceSong, userSongs)
    if (existing) {
      await sRepo.updateSongFolder(existing.id, folder.id)
      reused += 1
      continue
    }

    const newSongData: NewSongData = {
      title: sourceSong.title,
      author: sourceSong.author,
      content: sourceSong.content || renderStructuredSong(sourceSong),
      folderId: folder.id,
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
    }

    const created = await sRepo.createSong(newSongData)
    userSongs.push({
      id: created.id,
      tabId: created.tabId,
      sourceUrl: created.sourceUrl,
      title: created.title,
      author: created.author,
    })
    imported += 1
  }

  revalidatePath('/playlists')
  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/library/${validatedId}`)

  return {
    folderId: folder.id,
    folderName: folder.name,
    imported,
    reused,
    songCount: imported + reused,
  }
}
