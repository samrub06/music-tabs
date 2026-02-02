'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import { songRepo } from '@/lib/services/songRepo'
import { updateSongSchema } from '@/lib/validation/schemas'
import type { SongEditData } from '@/types'
import { revalidatePath } from 'next/cache'

export async function viewSongAction(songId: string) {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Not authenticated, skip XP
    return
  }
  
  const gamification = gamificationRepo(supabase)
  
  try {
    // Check if user has already viewed this song today
    const hasViewed = await gamification.hasViewedSongToday(user.id, songId)
    
    if (!hasViewed) {
      // Record the view
      await gamification.recordSongView(user.id, songId)
      
      // Award XP
      await gamification.awardXp(user.id, 5, 'view_song', songId)
      await gamification.incrementCounter(user.id, 'total_songs_viewed')
      await gamification.checkAndAwardBadges(user.id)
    }
  } catch (error) {
    // Log but don't fail if gamification fails
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
  revalidatePath('/library')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function deleteSongAction(id: string) {
  const supabase = await createActionServerClient()
  const repo = songRepo(supabase)
  await repo.deleteSong(id)
  revalidatePath('/songs')
  revalidatePath('/library')
  revalidatePath(`/song/${id}`)
}
