'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { getUserActivityChartsAction } from '@/app/(protected)/gamification/actions'
import type { ActivityPeriod, UserActivityCharts } from '@/types'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserActivityChartsProps {
  data: UserActivityCharts
  className?: string
}

const PERIODS: ActivityPeriod[] = ['7d', '30d', '90d', '12m', 'all']

function formatHours(minutes: number): string {
  const hours = minutes / 60
  if (hours < 1) return `${Math.round(minutes)} min`
  if (hours < 10) return `${hours.toFixed(1)} h`
  return `${Math.round(hours)} h`
}

function LineChart({ points }: { points: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...points.map((p) => p.count))
  const width = 280
  const height = 112
  const paddingX = 12
  const paddingTop = 18
  const paddingBottom = 8

  if (points.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    )
  }

  const plotHeight = height - paddingTop - paddingBottom
  const step = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = paddingX + index * step
    const y = height - paddingBottom - (point.count / max) * plotHeight
    return { x, y, ...point }
  })

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {coords.map((c) => (
          <g key={c.label}>
            <circle cx={c.x} cy={c.y} r="3" fill="hsl(var(--primary))" />
            <text
              x={c.x}
              y={c.y - 8}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {c.count}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-1 text-[10px] text-muted-foreground">
        {points.map((p) => (
          <span key={p.label} className="truncate">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function BarChart({ bars }: { bars: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...bars.map((b) => b.count))

  return (
    <div className="flex h-28 items-end justify-between gap-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold tabular-nums text-foreground">
            {bar.count}
          </span>
          <div
            className="w-full rounded-t-md bg-primary/80 transition-all"
            style={{ height: `${Math.max(4, (bar.count / max) * 72)}px` }}
            title={`${bar.count}`}
          />
          <span className="text-[10px] text-muted-foreground">{bar.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function UserActivityCharts({ data, className }: UserActivityChartsProps) {
  const { t } = useLanguage()
  const [period, setPeriod] = useState<ActivityPeriod>('12m')
  const [chartData, setChartData] = useState(data)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setChartData(data)
  }, [data])

  const handlePeriodChange = useCallback((value: string) => {
    const next = value as ActivityPeriod
    setPeriod(next)
    startTransition(async () => {
      try {
        const nextData = await getUserActivityChartsAction(next)
        if (nextData) setChartData(nextData)
      } catch (err) {
        console.error(err)
      }
    })
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {t('profile.activity')}
        </h2>
        <Select value={period} onValueChange={handlePeriodChange} disabled={pending}>
          <SelectTrigger className="h-9 w-[9.5rem] shrink-0 rounded-xl text-xs sm:w-40 sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`profile.activityPeriod.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          'space-y-4 transition-opacity',
          pending && 'opacity-60'
        )}
      >
        <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
          <p className="text-xs text-muted-foreground">{t('profile.timeSpent')}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatHours(chartData.timeSpentMinutes)}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t('profile.songsAddedChart')}
          </p>
          <LineChart points={chartData.songsAddedByMonth} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t('profile.activityByDay')}
          </p>
          <BarChart bars={chartData.activityByWeekday} />
        </div>
      </div>
    </div>
  )
}
