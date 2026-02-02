'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import type { UserStats, StreakUpdateResult, LeaderboardEntry } from '@/types'

/**
 * Get current user's stats
 */
export async function getUserStatsAction(): Promise<UserStats | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const gamification = gamificationRepo(supabase)
  return await gamification.getUserStats(user.id)
}

/**
 * Update streak (called on page load)
 */
export async function updateStreakAction(): Promise<StreakUpdateResult | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const gamification = gamificationRepo(supabase)
  return await gamification.updateStreak(user.id)
}

/**
 * Get leaderboard
 */
export async function getLeaderboardAction(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = await createActionServerClient()
  const gamification = gamificationRepo(supabase)
  return await gamification.getLeaderboard(limit)
}

/**
 * Get user's rank
 */
export async function getUserRankAction(): Promise<number | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const gamification = gamificationRepo(supabase)
  return await gamification.getUserRank(user.id)
}
