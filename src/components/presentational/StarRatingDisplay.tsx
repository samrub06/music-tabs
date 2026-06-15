'use client'

import { StarIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface StarRatingDisplayProps {
  rating: number
  maxStars?: number
  className?: string
  size?: 'sm' | 'md'
}

const starSizeClasses = {
  sm: { star: 'h-2.5 w-2.5', text: 'text-[10px]' },
  md: { star: 'h-3 w-3', text: 'text-xs' },
} as const

export function StarRatingDisplay({
  rating,
  maxStars = 5,
  className,
  size = 'sm',
}: StarRatingDisplayProps) {
  const clamped = Math.max(0, Math.min(maxStars, rating))
  const sizes = starSizeClasses[size]

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-0.5', className)}
      aria-label={`${clamped.toFixed(1)} / ${maxStars}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const fill = Math.max(0, Math.min(1, clamped - index))

          return (
            <div key={index} className={cn('relative shrink-0', sizes.star)}>
              <StarIcon className={cn(sizes.star, 'text-muted-foreground/25')} aria-hidden />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon className={cn(sizes.star, 'text-yellow-500')} aria-hidden />
              </div>
            </div>
          )
        })}
      </div>
      <span
        className={cn(
          'font-semibold tabular-nums leading-none text-yellow-600 dark:text-yellow-400',
          sizes.text
        )}
      >
        {clamped.toFixed(1)}
      </span>
    </div>
  )
}
