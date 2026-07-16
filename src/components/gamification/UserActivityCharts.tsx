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

const GENRE_COLORS = [
  'hsl(var(--primary))',
  '#e07a5f',
  '#3d8b7a',
  '#f2cc8f',
  '#81b29a',
  '#c17c74',
  '#6d6875',
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function PieChart({
  slices,
  localizeLabel,
}: {
  slices: Array<{ label: string; count: number }>
  localizeLabel: (label: string) => string
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const total = slices.reduce((sum, s) => sum + s.count, 0)

  if (total === 0 || slices.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    )
  }

  const size = 140
  const cx = size / 2
  const cy = size / 2
  const r = 58
  let angle = 0

  const arcs = slices.map((slice, index) => {
    const sweep = (slice.count / total) * 360
    const startAngle = angle
    const endAngle = angle + sweep
    angle = endAngle
    const isFullCircle = sweep >= 359.99
    return {
      ...slice,
      color: GENRE_COLORS[index % GENRE_COLORS.length],
      path: isFullCircle
        ? undefined
        : describeSlice(cx, cy, r, startAngle, endAngle),
      isFullCircle,
      midAngle: startAngle + sweep / 2,
    }
  })

  const hovered = arcs.find((a) => a.label === hoveredLabel) ?? null
  const hoveredPct = hovered ? Math.round((hovered.count / total) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-36 w-36"
          role="img"
          aria-label="Songs by genre"
          onMouseLeave={() => setHoveredLabel(null)}
        >
          {arcs.map((arc) => {
            const isHovered = hoveredLabel === arc.label
            const dimmed = hoveredLabel != null && !isHovered
            return arc.isFullCircle ? (
              <circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={r}
                fill={arc.color}
                opacity={dimmed ? 0.35 : 1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredLabel(arc.label)}
                onFocus={() => setHoveredLabel(arc.label)}
                tabIndex={0}
              >
                <title>
                  {localizeLabel(arc.label)} — {Math.round((arc.count / total) * 100)}% · {arc.count}
                </title>
              </circle>
            ) : (
              <path
                key={arc.label}
                d={arc.path}
                fill={arc.color}
                opacity={dimmed ? 0.35 : 1}
                stroke={isHovered ? 'hsl(var(--background))' : 'transparent'}
                strokeWidth={isHovered ? 2 : 0}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredLabel(arc.label)}
                onFocus={() => setHoveredLabel(arc.label)}
                tabIndex={0}
              >
                <title>
                  {localizeLabel(arc.label)} — {Math.round((arc.count / total) * 100)}% · {arc.count}
                </title>
              </path>
            )
          })}
        </svg>
        {hovered ? (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-max max-w-[9rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-center shadow-md"
            role="tooltip"
          >
            <p className="truncate text-xs font-semibold text-foreground">
              {localizeLabel(hovered.label)}
            </p>
            <p className="text-[10px] tabular-nums text-muted-foreground">
              {hoveredPct}% · {hovered.count}
            </p>
          </div>
        ) : null}
      </div>
      <ul className="w-full space-y-1.5 text-xs">
        {arcs.map((arc) => {
          const pct = Math.round((arc.count / total) * 100)
          const isHovered = hoveredLabel === arc.label
          return (
            <li
              key={arc.label}
              className={cn(
                'flex cursor-default items-center gap-2 rounded-md px-1 py-0.5 transition-colors',
                isHovered && 'bg-muted'
              )}
              onMouseEnter={() => setHoveredLabel(arc.label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: arc.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {localizeLabel(arc.label)}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {pct}% · {arc.count}
              </span>
            </li>
          )
        })}
      </ul>
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
            {period === '7d' || period === '30d'
              ? t('profile.activityOverTimeDaily')
              : t('profile.activityOverTimeMonthly')}
          </p>
          {period === '7d' ? (
            <BarChart bars={chartData.activityOverTime ?? []} />
          ) : (
            <LineChart points={chartData.activityOverTime ?? []} />
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t('profile.songsByGenre')}
          </p>
          <PieChart
            slices={chartData.songsByGenre ?? []}
            localizeLabel={(label) => {
              if (label === 'Unknown') return t('profile.genreUnknown')
              if (label === 'Other') return t('profile.genreOther')
              return label
            }}
          />
        </div>
      </div>
    </div>
  )
}
