'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FilterChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  /** Smaller padding for dense toolbars (e.g. landscape songs). */
  compact?: boolean
  title?: string
  'aria-label'?: string
}

export function FilterChip({
  active,
  onClick,
  children,
  className,
  compact = false,
  title,
  'aria-label': ariaLabel,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex min-w-0 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full font-medium',
        'transition-[color,background-color,transform,box-shadow] duration-300 ease-out',
        compact
          ? 'min-h-[28px] px-2 py-0.5 text-xs'
          : 'min-h-[36px] px-3.5 py-2 text-sm',
        active
          ? 'border border-primary/30 bg-primary/10 text-primary backdrop-blur-md dark:border-primary/40 dark:bg-primary/15'
          : 'border border-white/30 bg-white/15 text-muted-foreground backdrop-blur-md hover:bg-white/25 hover:text-foreground dark:border-white/[0.14] dark:bg-white/[0.06] dark:hover:bg-white/[0.12]',
        className
      )}
    >
      {active ? (
        <span
          key="chip-border-active"
          aria-hidden
          className="chip-snake-border pointer-events-none absolute inset-0 rounded-full"
        />
      ) : null}
      <span className="relative z-10 inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden">
        {children}
      </span>
    </button>
  )
}

interface FilterChipRowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function FilterChipRow({ title, children, className }: FilterChipRowProps) {
  return (
    <div className={className}>
      {title ? (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  )
}
