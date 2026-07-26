'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassActionTileProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  compact?: boolean
  'aria-label': string
  title?: string
  children: ReactNode
  className?: string
  /** Emphasize primary action (play) with a warm tint */
  variant?: 'default' | 'primary'
}

/**
 * Square frosted-glass action tile for playlist headers.
 */
export function GlassActionTile({
  onClick,
  disabled = false,
  loading = false,
  compact = false,
  'aria-label': ariaLabel,
  title,
  children,
  className,
  variant = 'default',
}: GlassActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        'group/wiggle relative flex shrink-0 items-center justify-center overflow-hidden',
        'rounded-2xl border border-white/30 dark:border-white/20',
        'bg-white/55 dark:bg-white/10 backdrop-blur-xl',
        'shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)]',
        'ring-1 ring-inset ring-white/35 dark:ring-white/15',
        'transition-all duration-200 active:scale-[0.97]',
        'hover:bg-white/70 dark:hover:bg-white/15',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        compact ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 sm:h-14 sm:w-14',
        variant === 'primary' &&
          'border-primary/35 bg-primary/15 hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30',
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-b-full bg-gradient-to-b from-white/50 to-transparent dark:from-white/20"
      />
      {loading ? (
        <span
          className={cn(
            'animate-spin rounded-full border-2 border-current border-t-transparent',
            compact ? 'h-3.5 w-3.5' : 'h-5 w-5'
          )}
        />
      ) : (
        <span
          className={cn(
            'relative z-[1] flex items-center justify-center text-foreground',
            variant === 'primary' && 'text-primary',
            compact ? '[&_svg]:h-4 [&_svg]:w-4' : '[&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6'
          )}
        >
          {children}
        </span>
      )}
    </button>
  )
}
