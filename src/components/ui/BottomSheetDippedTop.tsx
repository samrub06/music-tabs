'use client'

import { X } from 'lucide-react'
import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface BottomSheetDippedTopProps {
  className?: string
  onClose?: () => void
}

/**
 * Top cap for bottom sheets: rounded corners + central dip with a floating close button.
 */
export function BottomSheetDippedTop({ className, onClose }: BottomSheetDippedTopProps) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <SheetClose
        onClick={onClose}
        className="absolute left-1/2 top-0 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.06] bg-background text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-95 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-white/[0.08] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      >
        <X className="h-4 w-4" strokeWidth={2} />
        <span className="sr-only">Close</span>
      </SheetClose>

      <svg
        viewBox="0 0 375 32"
        className="block h-8 w-full drop-shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_-4px_16px_rgba(0,0,0,0.25)]"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="hsl(var(--background))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          d="M 0 32 V 12 Q 0 0 12 0 H 163.5 A 24 24 0 0 1 211.5 0 H 363 Q 375 0 375 12 V 32 Z"
        />
      </svg>
    </div>
  )
}
