'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FilterChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function FilterChip({ active, onClick, children, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 min-h-[36px] whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-white/[0.06] dark:hover:bg-white/10',
        className
      )}
    >
      {children}
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
