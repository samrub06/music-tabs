'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import type { UserStats, StreakUpdateResult, LeaderboardEntry, LeaderboardSheetData, UserBadge, UserActivityCharts, ActivityPeriod } from '@/types'
import { z } from 'zod'

const activityPeriodSchema = z.enum(['7d', '30d', '90d', '12m', 'all'])

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
 * Get leaderboard data for the header sheet
 */
export async function getLeaderboardSheetAction(): Promise<LeaderboardSheetData | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const gamification = gamificationRepo(supabase)
  return await gamification.getLeaderboardSheetData(user.id)
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

/**
 * Get user's badges
 */
export async function getUserBadgesAction(): Promise<UserBadge[]> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }
  
  const gamification = gamificationRepo(supabase)
  return await gamification.getUserBadges(user.id)
}

export async function getUserActivityChartsAction(
  period: ActivityPeriod = '12m'
): Promise<UserActivityCharts | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const validatedPeriod = activityPeriodSchema.parse(period)
  const gamification = gamificationRepo(supabase)
  return await gamification.getUserActivityCharts(user.id, validatedPeriod)
}
