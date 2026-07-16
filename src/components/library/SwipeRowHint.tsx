'use client'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

interface SwipeRowHintProps {
  className?: string
}

/**
 * Minimal swipe hint for horizontal card rows.
 * Parent controls mount/unmount; pointer-events none so scrolling still works.
 */
export function SwipeRowHint({ className }: SwipeRowHintProps) {
  const { t, isRtl } = useLanguage()

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 flex items-center justify-center',
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'animate-swipe-hint-fade flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3',
          'border border-black/[0.06] bg-white/80 text-muted-foreground shadow-sm backdrop-blur-md',
          'dark:border-white/[0.08] dark:bg-white/[0.08]'
        )}
      >
        <div className="relative flex h-8 w-20 items-center justify-center overflow-hidden">
          <div
            className={cn(
              'flex items-center',
              isRtl ? 'animate-swipe-hint-finger-rtl' : 'animate-swipe-hint-finger'
            )}
          >
            <FingerIcon className="h-7 w-7 shrink-0 text-foreground/70" />
          </div>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">
          {t('library.swipeForMore')}
        </p>
      </div>
    </div>
  )
}

function FingerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.29.29.68.45 1.09.45h6.85c.86 0 1.57-.64 1.68-1.48l.72-5.45a1.7 1.7 0 0 0-.89-1.71z" />
    </svg>
  )
}
