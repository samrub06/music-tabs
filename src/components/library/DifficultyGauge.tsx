'use client'

import { Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDifficultyTheme, type DifficultyLevel } from '@/lib/constants/difficultyTheme'

interface DifficultyGaugeProps {
  level: DifficultyLevel
  className?: string
  size?: number
}

const SEGMENT_COUNT = 4

export function DifficultyGauge({ level, className, size = 64 }: DifficultyGaugeProps) {
  const theme = getDifficultyTheme(level)
  const strokeWidth = 7
  const radius = size / 2 - strokeWidth
  const cx = size / 2
  const cy = size / 2 + 2

  const startX = cx - radius
  const startY = cy
  const endX = cx + radius
  const endY = cy
  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`

  const arcLength = Math.PI * radius
  const filledLength = (level / SEGMENT_COUNT) * arcLength
  const gapLength = arcLength - filledLength

  const iconSize = Math.round(size * 0.28)

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-end', className)}
      style={{ width: size, height: size * 0.72 }}
      aria-hidden
    >
      <svg
        width={size}
        height={size * 0.62}
        viewBox={`0 0 ${size} ${size * 0.62}`}
        className="overflow-visible"
      >
        {/* Light track — square caps; no pill rounding on the inactive color */}
        <path
          d={arcPath}
          fill="none"
          stroke={theme.trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        {/* Dark fill — round cap on the leading edge (where active meets track) */}
        {filledLength > 0 && (
          <path
            d={arcPath}
            fill="none"
            stroke={theme.activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${gapLength}`}
            strokeDashoffset={0}
            className="transition-all duration-300"
          />
        )}
      </svg>
      <Music
        size={iconSize}
        strokeWidth={2.25}
        className="absolute bottom-0"
        style={{ color: theme.activeColor }}
      />
    </div>
  )
}
