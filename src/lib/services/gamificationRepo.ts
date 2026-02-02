import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { UserStats, XpTransaction, UserBadge, LeaderboardEntry, XpAwardResult, StreakUpdateResult } from '@/types'
import { getBadgeDefinitions } from '@/utils/gamification'

// Helper to map DB result to Domain Entity
function mapDbStatsToDomain(dbStats: Database['public']['Tables']['user_stats']['Row']): UserStats {
  return {
    userId: dbStats.user_id,
    totalXp: dbStats.total_xp,
    currentLevel: dbStats.current_level,
    currentStreak: dbStats.current_streak,
    longestStreak: dbStats.longest_streak,
    lastActivityDate: dbStats.last_activity_date ? new Date(dbStats.last_activity_date) : null,
    totalSongsCreated: dbStats.total_songs_created,
    totalSongsViewed: dbStats.total_songs_viewed,
    totalFoldersCreated: dbStats.total_folders_created,
    totalPlaylistsCreated: dbStats.total_playlists_created,
    createdAt: new Date(dbStats.created_at),
    updatedAt: new Date(dbStats.updated_at)
  }
}

function mapDbTransactionToDomain(dbTransaction: Database['public']['Tables']['xp_transactions']['Row']): XpTransaction {
  return {
    id: dbTransaction.id,
    userId: dbTransaction.user_id,
    xpAmount: dbTransaction.xp_amount,
    actionType: dbTransaction.action_type as XpTransaction['actionType'],
    entityId: dbTransaction.entity_id || null,
    createdAt: new Date(dbTransaction.created_at)
  }
}

function mapDbBadgeToDomain(dbBadge: Database['public']['Tables']['user_badges']['Row']): UserBadge {
  return {
    id: dbBadge.id,
    userId: dbBadge.user_id,
    badgeType: dbBadge.badge_type as 'milestone' | 'achievement',
    badgeKey: dbBadge.badge_key,
    badgeName: dbBadge.badge_name,
    badgeDescription: dbBadge.badge_description || null,
    earnedAt: new Date(dbBadge.earned_at)
  }
}

export const gamificationRepo = (client: SupabaseClient<Database>) => ({
  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await client
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return null
        return null
      }
      throw error
    }

    return data ? mapDbStatsToDomain(data) : null
  },

  /**
   * Award XP to a user
   */
  async awardXp(
    userId: string,
    xpAmount: number,
    actionType: XpTransaction['actionType'],
    entityId?: string | null
  ): Promise<XpAwardResult> {
    const { data, error } = await client.rpc('award_xp', {
      p_user_id: userId,
      p_xp_amount: xpAmount,
      p_action_type: actionType,
      p_entity_id: entityId || null
    })

    if (error) {
      throw error
    }

    return {
      totalXp: data.total_xp,
      currentLevel: data.current_level,
      levelUp: data.level_up,
      oldLevel: data.old_level,
      newLevel: data.new_level
    }
  },

  /**
   * Update streak for daily login
   */
  async updateStreak(userId: string): Promise<StreakUpdateResult> {
    const { data, error } = await client.rpc('update_streak', {
      p_user_id: userId
    })

    if (error) {
      throw error
    }

    return {
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      streakIncremented: data.streak_incremented,
      dailyBonusAwarded: data.daily_bonus_awarded
    }
  },

  /**
   * Increment a counter in user_stats
   */
  async incrementCounter(userId: string, counterName: 'total_songs_created' | 'total_songs_viewed' | 'total_folders_created' | 'total_playlists_created'): Promise<void> {
    const { error } = await client.rpc('increment_user_stat_counter', {
      p_user_id: userId,
      p_counter_name: counterName
    })

    if (error) {
      throw error
    }
  },

  /**
   * Check if user has already viewed a song today
   */
  async hasViewedSongToday(userId: string, songId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await client
      .from('daily_song_views')
      .select('id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .eq('viewed_date', today)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, hasn't viewed today
        return false
      }
      throw error
    }

    return !!data
  },

  /**
   * Record a song view for today
   */
  async recordSongView(userId: string, songId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await client
      .from('daily_song_views')
      .insert({
        user_id: userId,
        song_id: songId,
        viewed_date: today
      })

    if (error) {
      // Ignore unique constraint violations (already viewed today)
      if (error.code !== '23505') {
        throw error
      }
    }
  },

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await client
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map(mapDbBadgeToDomain)
  },

  /**
   * Check and award badges based on current stats
   */
  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    // Get user stats
    const stats = await this.getUserStats(userId)
    if (!stats) {
      return []
    }

    // Get already earned badges
    const earnedBadges = await this.getUserBadges(userId)
    const earnedBadgeKeys = new Set(earnedBadges.map(b => b.badgeKey))

    // Get badge definitions
    const badgeDefinitions = getBadgeDefinitions()
    const newBadges: UserBadge[] = []

    // Check each badge definition
    for (const badgeDef of badgeDefinitions) {
      // Skip if already earned
      if (earnedBadgeKeys.has(badgeDef.key)) {
        continue
      }

      // Check if condition is met
      if (badgeDef.checkCondition(stats)) {
        // Award badge
        const { data, error } = await client
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_type: badgeDef.type,
            badge_key: badgeDef.key,
            badge_name: badgeDef.name,
            badge_description: badgeDef.description
          })
          .select()
          .single()

        if (error) {
          // Ignore unique constraint violations (race condition)
          if (error.code !== '23505') {
            console.error('Error awarding badge:', error)
          }
        } else if (data) {
          newBadges.push(mapDbBadgeToDomain(data))
        }
      }
    }

    return newBadges
  },

  /**
   * Get leaderboard (top users by XP)
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    // Get top users by XP
    const { data: statsData, error: statsError } = await client
      .from('user_stats')
      .select('user_id, total_xp, current_level, current_streak')
      .order('total_xp', { ascending: false })
      .limit(limit)

    if (statsError) {
      throw statsError
    }

    if (!statsData || statsData.length === 0) {
      return []
    }

    // Get user profiles for these users
    const userIds = statsData.map(s => s.user_id)
    const { data: profilesData, error: profilesError } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      throw profilesError
    }

    // Get badges for these users
    const { data: badgesData, error: badgesError } = await client
      .from('user_badges')
      .select('*')
      .in('user_id', userIds)

    if (badgesError) {
      throw badgesError
    }

    // Count songs per user
    const { data: songsData, error: songsError } = await client
      .from('songs')
      .select('user_id')
      .in('user_id', userIds)
      .not('user_id', 'is', null)

    if (songsError) {
      throw songsError
    }

    // Count playlists per user
    const { data: playlistsData, error: playlistsError } = await client
      .from('playlists')
      .select('user_id')
      .in('user_id', userIds)

    if (playlistsError) {
      throw playlistsError
    }

    // Create a map of user_id -> profile
    const profileMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    )

    // Create a map of user_id -> badges
    const badgesMap = new Map<string, UserBadge[]>()
    for (const badge of badgesData || []) {
      const userId = badge.user_id
      if (!badgesMap.has(userId)) {
        badgesMap.set(userId, [])
      }
      badgesMap.get(userId)!.push(mapDbBadgeToDomain(badge))
    }

    // Create a map of user_id -> song count
    const songCountMap = new Map<string, number>()
    for (const song of songsData || []) {
      if (song.user_id) {
        songCountMap.set(song.user_id, (songCountMap.get(song.user_id) || 0) + 1)
      }
    }

    // Create a map of user_id -> playlist count
    const playlistCountMap = new Map<string, number>()
    for (const playlist of playlistsData || []) {
      if (playlist.user_id) {
        playlistCountMap.set(playlist.user_id, (playlistCountMap.get(playlist.user_id) || 0) + 1)
      }
    }

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = statsData.map((stat, index) => {
      const profile = profileMap.get(stat.user_id)
      const badges = badgesMap.get(stat.user_id) || []
      const songCount = songCountMap.get(stat.user_id) || 0
      const playlistCount = playlistCountMap.get(stat.user_id) || 0

      return {
        rank: index + 1,
        userId: stat.user_id,
        email: profile?.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        totalXp: stat.total_xp,
        currentLevel: stat.current_level,
        currentStreak: stat.current_streak,
        badges,
        songCount,
        playlistCount
      }
    })

    return entries
  },

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(userId: string): Promise<number | null> {
    // Get user's XP
    const stats = await this.getUserStats(userId)
    if (!stats) {
      return null
    }

    // Count how many users have more XP
    const { count, error } = await client
      .from('user_stats')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', stats.totalXp)

    if (error) {
      throw error
    }

    // Rank is count + 1
    return count !== null ? count + 1 : null
  },

  /**
   * Get XP transactions for a user
   */
  async getXpTransactions(userId: string, limit: number = 50): Promise<XpTransaction[]> {
    const { data, error } = await client
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []).map(mapDbTransactionToDomain)
  }
})
