import type { UserStats } from '@/types'

/**
 * Calculate level from total XP
 * Formula: XP needed for level N = 100 * (1.5^(N-1)) rounded
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp < 100) {
    return 1
  }
  
  let level = 1
  while (true) {
    level++
    const xpNeeded = Math.round(100 * Math.pow(1.5, level - 1))
    if (xp < xpNeeded) {
      return level - 1
    }
  }
}

/**
 * Calculate XP needed for a specific level
 */
export function calculateXpForLevel(level: number): number {
  if (level <= 1) {
    return 0
  }
  return Math.round(100 * Math.pow(1.5, level - 1))
}

/**
 * Calculate XP progress to next level
 */
export function calculateXpProgress(currentXp: number, currentLevel: number): { current: number; next: number } {
  const xpForCurrentLevel = currentLevel === 1 ? 0 : calculateXpForLevel(currentLevel)
  const xpForNextLevel = calculateXpForLevel(currentLevel + 1)
  const currentProgress = currentXp - xpForCurrentLevel
  const totalNeeded = xpForNextLevel - xpForCurrentLevel
  
  return {
    current: currentProgress,
    next: totalNeeded
  }
}

/**
 * Badge definitions
 */
export interface BadgeDefinition {
  key: string
  type: 'milestone' | 'achievement'
  name: string
  description: string
  checkCondition: (stats: UserStats) => boolean
}

export function getBadgeDefinitions(): BadgeDefinition[] {
  return [
    // Milestone badges
    {
      key: 'first_song',
      type: 'milestone',
      name: 'First Song',
      description: 'Create your first song',
      checkCondition: (stats) => stats.totalSongsCreated >= 1
    },
    {
      key: 'song_collector',
      type: 'milestone',
      name: 'Song Collector',
      description: 'Create 10 songs',
      checkCondition: (stats) => stats.totalSongsCreated >= 10
    },
    {
      key: 'song_master',
      type: 'milestone',
      name: 'Song Master',
      description: 'Create 50 songs',
      checkCondition: (stats) => stats.totalSongsCreated >= 50
    },
    {
      key: 'song_legend',
      type: 'milestone',
      name: 'Song Legend',
      description: 'Create 100 songs',
      checkCondition: (stats) => stats.totalSongsCreated >= 100
    },
    {
      key: 'folder_organizer',
      type: 'milestone',
      name: 'Folder Organizer',
      description: 'Create 10 folders',
      checkCondition: (stats) => stats.totalFoldersCreated >= 10
    },
    {
      key: 'playlist_creator',
      type: 'milestone',
      name: 'Playlist Creator',
      description: 'Create 5 playlists',
      checkCondition: (stats) => stats.totalPlaylistsCreated >= 5
    },
    {
      key: 'viewer',
      type: 'milestone',
      name: 'Viewer',
      description: 'View 50 songs',
      checkCondition: (stats) => stats.totalSongsViewed >= 50
    },
    {
      key: 'explorer',
      type: 'milestone',
      name: 'Explorer',
      description: 'View 200 songs',
      checkCondition: (stats) => stats.totalSongsViewed >= 200
    },
    // Achievement badges
    {
      key: 'week_warrior',
      type: 'achievement',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      checkCondition: (stats) => stats.currentStreak >= 7
    },
    {
      key: 'month_master',
      type: 'achievement',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      checkCondition: (stats) => stats.currentStreak >= 30
    },
    {
      key: 'streak_champion',
      type: 'achievement',
      name: 'Streak Champion',
      description: 'Maintain a 100-day streak',
      checkCondition: (stats) => stats.currentStreak >= 100
    },
    {
      key: 'dedicated',
      type: 'achievement',
      name: 'Dedicated',
      description: 'Reach level 10',
      checkCondition: (stats) => stats.currentLevel >= 10
    },
    {
      key: 'elite',
      type: 'achievement',
      name: 'Elite',
      description: 'Reach level 20',
      checkCondition: (stats) => stats.currentLevel >= 20
    }
  ]
}
