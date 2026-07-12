'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'
import { calculateXpProgress } from '@/utils/gamification'
import { useLanguage } from '@/context/LanguageContext'
import LeaderboardSheet from './LeaderboardSheet'
import { cn } from '@/lib/utils'

interface HeaderLevelProgressProps {
  className?: string
}

export default function HeaderLevelProgress({ className }: HeaderLevelProgressProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getUserStatsAction>>>(null)
  const [animatedPercent, setAnimatedPercent] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    getUserStatsAction().then(setStats).catch(console.error)
  }, [])

  const targetPercent = useMemo(() => {
    if (!stats) return 0
    const progress = calculateXpProgress(stats.totalXp, stats.currentLevel)
    if (progress.next <= 0) return 100
    return Math.min(100, (progress.current / progress.next) * 100)
  }, [stats])

  useEffect(() => {
    if (!stats) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setAnimatedPercent(targetPercent)
      return
    }

    setAnimatedPercent(0)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatedPercent(targetPercent))
    })
    return () => cancelAnimationFrame(frame)
  }, [stats, targetPercent])

  const levelLabel = stats
    ? t('gamification.LEVEL_WITH_NUMBER').replace('{level}', String(stats.currentLevel))
    : t('gamification.LEVEL')

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-1.5 py-1 transition-colors hover:bg-muted/70 sm:gap-2 sm:px-2.5',
          className
        )}
        aria-label={levelLabel}
      >
        <TrophyIcon
          className="size-3.5 shrink-0 text-amber-500 dark:text-amber-400 sm:size-4"
          aria-hidden
        />
        <span className="shrink-0 text-[10px] font-bold tabular-nums text-foreground sm:text-xs">
          {stats ? stats.currentLevel : '—'}
        </span>
        <div
          className="h-1.5 w-8 min-w-8 flex-1 overflow-hidden rounded-full bg-muted-foreground/20 sm:h-2 sm:w-12 sm:min-w-12"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${animatedPercent}%` }}
          />
        </div>
      </button>
      <LeaderboardSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
