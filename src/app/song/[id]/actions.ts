'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'

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
