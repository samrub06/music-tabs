'use client'

import { X } from 'lucide-react'
import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface BottomSheetDippedTopProps {
  className?: string
  onClose?: () => void
  hideBorder?: boolean
}

/**
 * Top cap for bottom sheets: rounded corners + central dip with a floating close button.
 */
export function BottomSheetDippedTop({ className, onClose, hideBorder = false }: BottomSheetDippedTopProps) {
  return (
    <div className={cn('relative z-[70] shrink-0 overflow-visible bg-background', className)}>
      <div className="pointer-events-none absolute left-1/2 top-0 z-[70] -translate-x-1/2 -translate-y-1/2">
        <div
          aria-hidden
          className="h-[52px] w-[52px] rounded-full bg-background shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-none dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        />
      </div>

      <SheetClose
        onClick={onClose}
        className="absolute left-1/2 top-0 z-[71] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-none backdrop-blur-none transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        <X className="h-4 w-4" strokeWidth={2} />
        <span className="sr-only">Close</span>
      </SheetClose>

      <svg
        viewBox="0 0 375 32"
        className={cn(
          'block h-8 w-full bg-background',
          !hideBorder && 'drop-shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_-4px_16px_rgba(0,0,0,0.25)]'
        )}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          className="fill-background"
          stroke={hideBorder ? 'none' : 'hsl(var(--border))'}
          strokeWidth={hideBorder ? 0 : 1}
          vectorEffect="non-scaling-stroke"
          d="M 0 32 V 12 Q 0 0 12 0 H 163.5 A 24 24 0 0 1 211.5 0 H 363 Q 375 0 375 12 V 32 Z"
        />
      </svg>
    </div>
  )
}
