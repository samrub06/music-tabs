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
  /**
   * `clear` — transparent glass, no shadow (sign-in / add).
   * `primary` — glass with primary tint + soft shadow (play).
   * `default` — same as clear.
   */
  variant?: 'default' | 'clear' | 'primary'
}

/**
 * Frosted-glass action tile.
 * Clear = translucent wash + blur, no drop shadow.
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
  variant = 'clear',
}: GlassActionTileProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        'group/wiggle relative flex shrink-0 items-center justify-center overflow-hidden',
        'rounded-2xl border backdrop-blur-xl',
        'ring-1 ring-inset transition-all duration-200 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        compact ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 sm:h-14 sm:w-14',
        isPrimary
          ? 'border-primary/40 bg-transparent text-primary shadow-[0_8px_24px_-10px_rgba(0,0,0,0.28)] ring-primary/20 hover:bg-primary/10 dark:hover:bg-primary/15'
          : cn(
              'border-white/45 bg-zinc-200/55 text-foreground shadow-none backdrop-saturate-150',
              'ring-white/35 hover:bg-zinc-200/70',
              'dark:border-white/20 dark:bg-zinc-400/20 dark:ring-white/15 dark:hover:bg-zinc-400/30'
            ),
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-b-full bg-gradient-to-b to-transparent',
          isPrimary ? 'from-primary/20' : 'from-white/45 dark:from-white/20'
        )}
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
            'relative z-[1] inline-flex items-center justify-center gap-1.5',
            isPrimary ? 'text-primary' : 'text-foreground',
            compact
              ? '[&_svg]:h-4 [&_svg]:w-4'
              : '[&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6'
          )}
        >
          {children}
        </span>
      )}
    </button>
  )
}
