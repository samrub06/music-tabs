'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { UserActivityCharts } from '@/types'
import { cn } from '@/lib/utils'

interface UserActivityChartsProps {
  data: UserActivityCharts
  className?: string
}

function formatHours(minutes: number): string {
  const hours = minutes / 60
  if (hours < 1) return `${Math.round(minutes)} min`
  if (hours < 10) return `${hours.toFixed(1)} h`
  return `${Math.round(hours)} h`
}

function LineChart({ points }: { points: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...points.map((p) => p.count))
  const width = 280
  const height = 96
  const padding = 8

  if (points.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    )
  }

  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = padding + index * step
    const y = height - padding - (point.count / max) * (height - padding * 2)
    return { x, y, ...point }
  })

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3" fill="hsl(var(--primary))" />
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
    <div className="flex h-24 items-end justify-between gap-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
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

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
        <p className="text-xs text-muted-foreground">{t('profile.timeSpent')}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
          {formatHours(data.timeSpentMinutes)}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t('profile.songsAddedChart')}
        </p>
        <LineChart points={data.songsAddedByMonth} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t('profile.activityByDay')}
        </p>
        <BarChart bars={data.activityByWeekday} />
      </div>
    </div>
  )
}
