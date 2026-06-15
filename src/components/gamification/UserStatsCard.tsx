'use client'

import { useEffect, useState } from 'react'
import type { UserStats, XpAwardResult } from '@/types'
import LevelProgressBar from './LevelProgressBar'
import StreakDisplay from './StreakDisplay'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'
import { useLanguage } from '@/context/LanguageContext'

interface UserStatsCardProps {
  initialStats?: UserStats | null
  className?: string
  onLevelUp?: (result: XpAwardResult) => void
}

export default function UserStatsCard({ initialStats, className = '', onLevelUp }: UserStatsCardProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<UserStats | null>(initialStats || null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    // Refresh stats on mount
    getUserStatsAction().then(setStats).catch(console.error)
  }, [])

  if (!stats) {
    return (
      <div
        className={`rounded-2xl border border-black/[0.06] bg-card p-4 text-sm text-muted-foreground dark:border-white/[0.08] sm:p-5 ${className}`}
      >
        <p>{t('gamification.LOADING_STATS')}</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5 ${className}`}
    >
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-base font-semibold text-foreground">
            {t('gamification.YOUR_PROGRESS')}
          </h3>
          <LevelProgressBar currentXp={stats.totalXp} currentLevel={stats.currentLevel} />
        </div>
        
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">{t('gamification.TOTAL_XP')}</p>
            <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {stats.totalXp.toLocaleString()}
            </p>
          </div>
          <StreakDisplay currentStreak={stats.currentStreak} />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('gamification.SONGS_CREATED')}</p>
            <p className="text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {stats.totalSongsCreated}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('gamification.SONGS_VIEWED')}</p>
            <p className="text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {stats.totalSongsViewed}
            </p>
          </div>
        </div>
      </div>

      {showLevelUp && (
        <div className="mt-4 animate-pulse rounded-xl bg-green-500/10 p-3">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            {t('gamification.LEVEL_UP')}
          </p>
        </div>
      )}
    </div>
  )
}
