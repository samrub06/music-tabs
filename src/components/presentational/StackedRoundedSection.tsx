'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StackedRoundedSectionProps {
  children: ReactNode
  className?: string
  /** Extra classes for the main (front) card surface. */
  surfaceClassName?: string
}

/**
 * Stacked rounded glass shell — soft plates behind a frosted front card.
 * Matches the audio-player stacked look for song page sections.
 */
export function StackedRoundedSection({
  children,
  className,
  surfaceClassName,
}: StackedRoundedSectionProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-2.5 -bottom-1.5 top-2.5',
          'rounded-[1.45rem] bg-white/35 dark:bg-white/[0.035]',
          'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
          'translate-y-1.5 scale-[0.97] blur-[0.3px]'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-1.5 -bottom-0.5 top-1',
          'rounded-[1.55rem] bg-white/50 dark:bg-white/[0.055]',
          'ring-1 ring-black/[0.05] dark:ring-white/[0.07]',
          'translate-y-0.5 scale-[0.985]'
        )}
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.65rem]',
          'border border-black/[0.07] bg-background/85 text-foreground backdrop-blur-xl',
          'dark:border-white/[0.10] dark:bg-zinc-950/72',
          'shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55)]',
          surfaceClassName
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent dark:via-white/18"
        />
        {children}
      </div>
    </div>
  )
}

/** Shared accordion header look inside a stacked section. */
export const stackedSectionTriggerClassName = cn(
  'flex w-full min-h-[48px] cursor-pointer select-none items-center gap-3',
  'px-4 py-3 text-start font-semibold text-foreground touch-manipulation',
  'transition-colors hover:bg-muted/45 dark:hover:bg-white/[0.04]'
)
