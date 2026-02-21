'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import { songRepo } from '@/lib/services/songRepo'
import { updateSongSchema } from '@/lib/validation/schemas'
import type { SongEditData } from '@/types'
import { revalidatePath } from 'next/cache'

/** Records a song view: increments view_count, updates updated_at, awards XP, and revalidates /songs */
export async function recordSongViewAction(songId: string) {
  const supabase = await createActionServerClient()

  // 1. Increment view count and update updated_at (RPC updates both)
  const { error } = await supabase.rpc('increment_view_count', { song_id: songId })
  if (error) {
    console.error('Error incrementing view count:', error)
  }

  // 2. Gamification (XP) for authenticated users
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const gamification = gamificationRepo(supabase)
    try {
      const hasViewed = await gamification.hasViewedSongToday(user.id, songId)
      if (!hasViewed) {
        await gamification.recordSongView(user.id, songId)
        await gamification.awardXp(user.id, 5, 'view_song', songId)
        await gamification.incrementCounter(user.id, 'total_songs_viewed')
        await gamification.checkAndAwardBadges(user.id)
      }
    } catch (err) {
      console.error('Error awarding XP for song view:', err)
    }
  }

  // 3. Revalidate pages so Recent tab shows fresh data when user navigates back
  revalidatePath('/songs')
  revalidatePath('/search')
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

export async function updateSongAction(id: string, updates: SongEditData) {
  const validatedUpdates = updateSongSchema.parse(updates)
  const supabase = await createActionServerClient()
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
  revalidatePath('/search')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function deleteSongAction(id: string) {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.deleteSong(id)
  revalidatePath('/songs')
  revalidatePath('/search')
  revalidatePath(`/song/${id}`)
}
