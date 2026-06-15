'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '@/utils/triggerXpConfetti'
import { xpLog } from '@/utils/xpLog'

export interface XpCelebrationProps {
  xpLabel: string
  levelUp?: boolean
  levelUpLabel?: string
  onDone: () => void
}

export default function XpCelebration({
  xpLabel,
  levelUp = false,
  levelUpLabel,
  onDone,
}: XpCelebrationProps) {
  useEffect(() => {
    const reducedMotion = prefersReducedMotion()
    xpLog('celebration_show', { levelUp, reducedMotion, xpLabel })

    const timer = window.setTimeout(onDone, 1100)
    return () => window.clearTimeout(timer)
  }, [levelUp, onDone, xpLabel])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[10001] flex flex-col items-center justify-center gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="animate-xp-float text-5xl font-extrabold tabular-nums tracking-tight text-amber-500 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:text-amber-400 sm:text-6xl">
        {xpLabel}
      </span>
      {levelUp && levelUpLabel && (
        <span className="animate-xp-float text-lg font-bold text-green-600 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] dark:text-green-400 sm:text-xl">
          {levelUpLabel}
        </span>
      )}
    </div>,
    document.body
  )
}
