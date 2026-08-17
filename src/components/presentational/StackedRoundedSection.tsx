'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StackedRoundedSectionProps {
  children: ReactNode
  className?: string
  /** Extra classes for the card surface. */
  surfaceClassName?: string
}

/**
 * Single rounded frosted card for song page sections (no behind plates).
 */
export function StackedRoundedSection({
  children,
  className,
  surfaceClassName,
}: StackedRoundedSectionProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[1.65rem]',
        'border border-black/[0.07] bg-background/85 text-foreground backdrop-blur-xl',
        'dark:border-white/[0.10] dark:bg-zinc-950/72',
        'shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55)]',
        className,
        surfaceClassName
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent dark:via-white/18"
      />
      {children}
    </div>
  )
}

/** Shared accordion header look inside a stacked section. */
export const stackedSectionTriggerClassName = cn(
  'flex w-full min-h-[48px] cursor-pointer select-none items-center gap-3',
  'px-4 py-3 text-start font-semibold text-foreground touch-manipulation',
  'transition-colors hover:bg-muted/45 dark:hover:bg-white/[0.04]'
)
