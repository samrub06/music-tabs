'use client'

import { useEffect, useState } from 'react'
import type { UserStats } from '@/types'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'
import { useLanguage } from '@/context/LanguageContext'
import StreakDisplay from './StreakDisplay'
import { FireIcon } from '@heroicons/react/24/solid'

interface CompactStatsDisplayProps {
  className?: string
}

export default function CompactStatsDisplay({ className = '' }: CompactStatsDisplayProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    getUserStatsAction().then(setStats).catch(console.error)
  }, [])

  if (!stats) {
    return null
  }

  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-gray-600 dark:text-gray-400">{t('gamification.LEVEL')}</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{stats.currentLevel}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-600 dark:text-gray-400">{t('gamification.XP')}</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{stats.totalXp.toLocaleString()}</span>
      </div>
      {stats.currentStreak > 0 && (
        <StreakDisplay currentStreak={stats.currentStreak} />
      )}
    </div>
  )
}
