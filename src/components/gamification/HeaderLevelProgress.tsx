'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getUserStatsAction } from '@/app/(protected)/gamification/actions'
import { calculateXpProgress } from '@/utils/gamification'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

interface HeaderLevelProgressProps {
  className?: string
}

export default function HeaderLevelProgress({ className }: HeaderLevelProgressProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getUserStatsAction>>>(null)
  const [animatedPercent, setAnimatedPercent] = useState(0)

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
    <Link
      href="/profile"
      className={cn(
        'flex min-w-0 max-w-[8.5rem] items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2 py-1 transition-colors hover:bg-muted/70 sm:max-w-[10rem] sm:gap-2 sm:px-2.5',
        className
      )}
      aria-label={levelLabel}
    >
      <span className="shrink-0 text-[10px] font-bold tabular-nums text-foreground sm:text-xs">
        {stats ? stats.currentLevel : '—'}
      </span>
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
    </Link>
  )
}
