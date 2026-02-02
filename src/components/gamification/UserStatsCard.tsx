'use client'

import { useEffect, useState } from 'react'
import type { UserStats, XpAwardResult } from '@/types'
import LevelProgressBar from './LevelProgressBar'
import StreakDisplay from './StreakDisplay'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'

interface UserStatsCardProps {
  initialStats?: UserStats | null
  className?: string
  onLevelUp?: (result: XpAwardResult) => void
}

export default function UserStatsCard({ initialStats, className = '', onLevelUp }: UserStatsCardProps) {
  const [stats, setStats] = useState<UserStats | null>(initialStats || null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    // Refresh stats on mount
    getUserStatsAction().then(setStats).catch(console.error)
  }, [])

  if (!stats) {
    return (
      <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Your Progress
          </h3>
          <LevelProgressBar currentXp={stats.totalXp} currentLevel={stats.currentLevel} />
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalXp.toLocaleString()}
            </p>
          </div>
          <StreakDisplay currentStreak={stats.currentStreak} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Songs Created</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.totalSongsCreated}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Songs Viewed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.totalSongsViewed}
            </p>
          </div>
        </div>
      </div>

      {showLevelUp && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg animate-pulse">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            🎉 Level Up! 🎉
          </p>
        </div>
      )}
    </div>
  )
}
