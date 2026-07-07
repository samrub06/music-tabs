'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import { songRepo } from '@/lib/services/songRepo'
import { assertCanDeleteSong, assertCanEditSong } from '@/lib/services/songPermissions'
import { songService } from '@/lib/services/songService'
import { getOrCreateSongStory } from '@/lib/services/songStoryService'
import { toggleSongFavoriteSchema, updateSongSchema, getSongStorySchema } from '@/lib/validation/schemas'
import type { SongEditData, SongProgressResult, SongStory } from '@/types'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { LibrarySongRef } from '@/utils/songSuggestions'

/** Returns lightweight library song refs for end-of-song suggestions (client lazy load). */
export async function getLibrarySongRefsAction(): Promise<LibrarySongRef[]> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const songs = await songRepo(supabase).getAllSongsForPlaylist()
  return songs.map((s) => ({
    id: s.id,
    title: s.title,
    author: s.author,
    genre: s.genre,
    songImageUrl: s.songImageUrl,
    artistImageUrl: s.artistImageUrl,
  }))
}

/** Background-friendly: returns cached shared story or generates once per song+language. */
export async function getSongStoryAction(
  payload: unknown
): Promise<{ story: SongStory | null }> {
  const validated = getSongStorySchema.parse(payload)
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { story } = await getOrCreateSongStory(
    supabase,
    {
      title: validated.title,
      author: validated.author,
      tabId: validated.tabId,
      genre: validated.genre,
      key: validated.key,
      chordProgression: validated.chordProgression,
      language: validated.language,
    },
    { canGenerate: Boolean(user) }
  )
  return { story }
}

const SONG_VIEW_XP = 5

/** Records a song view: increments view_count only. XP is awarded via completeSongProgressAction. */
export async function recordSongViewAction(songId: string) {
  const supabase = await createActionServerClient()

  try {
    await songService.incrementViewCount(songId, supabase)
  } catch (error) {
    console.error('Error incrementing view count:', error)
  }
}

/** Awards +5 XP when the user completes a song (Next in playlist or end-of-list scroll). */
export async function completeSongProgressAction(songId: string): Promise<SongProgressResult> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { awarded: false, reason: 'unauthenticated' }
  }

  const gamification = gamificationRepo(supabase)

  try {
    const hasViewed = await gamification.hasViewedSongToday(user.id, songId)
    if (hasViewed) {
      return { awarded: false, reason: 'already_viewed_today' }
    }

    await gamification.recordSongView(user.id, songId)
    const xpResult = await gamification.awardXp(user.id, SONG_VIEW_XP, 'view_song', songId)
    await gamification.incrementCounter(user.id, 'total_songs_viewed')
    await gamification.checkAndAwardBadges(user.id)

    revalidatePath('/songs')

    return {
      awarded: true,
      xpAmount: SONG_VIEW_XP,
      levelUp: xpResult.levelUp,
      newLevel: xpResult.newLevel,
      totalXp: xpResult.totalXp,
    }
  } catch (error) {
    console.error('[xp] completeSongProgress failed', { songId, error })
    return { awarded: false, reason: 'error' }
  }
}

/** @deprecated Use recordSongViewAction instead. Kept for backward compatibility. */
export async function viewSongAction(songId: string) {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return
  }
  
  const gamification = gamificationRepo(supabase)
  
  try {
    const hasViewed = await gamification.hasViewedSongToday(user.id, songId)
    
    if (!hasViewed) {
      await gamification.recordSongView(user.id, songId)
      await gamification.awardXp(user.id, 5, 'view_song', songId)
      await gamification.incrementCounter(user.id, 'total_songs_viewed')
      await gamification.checkAndAwardBadges(user.id)
    }
  } catch (error) {
    console.error('Error awarding XP for song view:', error)
  }
}

export async function toggleSongFavoriteAction(songId: string) {
  const { songId: validatedId } = toggleSongFavoriteSchema.parse({ songId })
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  const isLiked = await repo.toggleSongLike(validatedId)

  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/song/${validatedId}`)

  return { isLiked }
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const validatedUpdates = updateSongSchema.parse(updates)
  const supabase = await createActionServerClient()
  await assertCanEditSong(supabase, id)
  const repo = songRepo(supabase)
  const normalizedUpdates: SongEditData = {
    ...validatedUpdates,
    folderId: validatedUpdates.folderId ?? undefined
  }
  const updated = await repo.updateSong(id, normalizedUpdates)
  
  // Award XP for editing song
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const gamification = gamificationRepo(supabase)
    try {
      await gamification.awardXp(user.id, 10, 'edit_song', id)
    } catch (error) {
      console.error('Error awarding XP for song edit:', error)
    }
  }
  
  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/song/${id}`)
  revalidateTag(`song-${id}`)
  return updated
}

export async function deleteSongAction(id: string) {
  const supabase = await createActionServerClient()
  await assertCanDeleteSong(supabase, id)
  const repo = songRepo(supabase)
  await repo.deleteSong(id)
  revalidatePath('/songs')
  revalidatePath('/')
  revalidatePath(`/song/${id}`)
}
