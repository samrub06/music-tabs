'use client'

import { useEffect, useState } from 'react'
import type { UserStats } from '@/types'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'
import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/skeleton'
import StreakDisplay from './StreakDisplay'

interface CompactStatsDisplayProps {
  className?: string
}

function CompactStatsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1.5 text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-9" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
}

export default function CompactStatsDisplay({ className = '' }: CompactStatsDisplayProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserStatsAction()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <CompactStatsSkeleton className={className} />
  }

  if (!stats) {
    return null
  }

  return (
    <div className={`space-y-1.5 text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-muted-foreground">{t('gamification.LEVEL')}</span>
          <span className="font-bold">{stats.currentLevel}</span>
        </div>
        {stats.currentStreak > 0 && (
          <StreakDisplay
            currentStreak={stats.currentStreak}
            className="gap-1.5 [&_svg]:size-4"
          />
        )}
      </div>
    </div>
  )
}
