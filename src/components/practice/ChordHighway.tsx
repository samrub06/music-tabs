'use client'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useMemo } from 'react'

interface ChordHighwayProps {
  /** Flat list of chord symbols feeding the highway (usually from upcoming lines). */
  chords: string[]
  /** Index of the chord that should sit at the NOW playhead. */
  activeIndex: number
  className?: string
}

const LOOKAHEAD = 10
const LOOKBEHIND = 3
const PILL_WIDTH_PX = 64
const PILL_GAP_PX = 12
const PLAYHEAD_RATIO = 0.22

/**
 * Horizontal highway of chord pills scrolling toward a fixed NOW playhead.
 * Simply Piano–inspired, simplified to chord names only.
 */
export function ChordHighway({ chords, activeIndex, className }: ChordHighwayProps) {
  const { t } = useLanguage()

  const { windowed, activeInWindow } = useMemo(() => {
    const clamped = Math.max(0, Math.min(activeIndex, Math.max(chords.length - 1, 0)))
    const start = Math.max(0, clamped - LOOKBEHIND)
    const end = Math.min(chords.length, clamped + LOOKAHEAD + 1)
    return {
      windowed: chords.slice(start, end).map((chord, i) => ({
        chord,
        absoluteIndex: start + i,
      })),
      activeInWindow: clamped - start,
    }
  }, [chords, activeIndex])

  // Align active pill center under the playhead (approx. via fixed pill geometry).
  const translateX = useMemo(() => {
    const step = PILL_WIDTH_PX + PILL_GAP_PX
    const activeCenter = activeInWindow * step + PILL_WIDTH_PX / 2
    // Playhead is at PLAYHEAD_RATIO of viewport; translate track so activeCenter lands there.
    // We approximate viewport via a large container — CSS uses left: 22% for the line;
    // transform origin is the track start inside padded content. Using calc-friendly px:
    return `calc(${PLAYHEAD_RATIO * 100}% - ${activeCenter}px)`
  }, [activeInWindow])

  if (chords.length === 0) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center rounded-2xl border border-border bg-card/60 text-sm text-muted-foreground',
          className
        )}
      >
        {t('songContent.landscapePractice.noChords')}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative h-full overflow-hidden rounded-2xl border border-border bg-card',
        className
      )}
      aria-label={t('songContent.landscapePractice.highwayLabel')}
    >
      {/* NOW playhead */}
      <div
        className="pointer-events-none absolute inset-y-0 z-20 flex w-px flex-col items-center"
        style={{ left: `${PLAYHEAD_RATIO * 100}%` }}
      >
        <div className="mt-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          {t('songContent.landscapePractice.now')}
        </div>
        <div className="mt-1 w-0.5 flex-1 bg-primary/80 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-20 bg-gradient-to-l from-card to-transparent" />

      <div className="flex h-full items-center overflow-hidden">
        <div
          className="flex items-center will-change-transform"
          style={{
            gap: PILL_GAP_PX,
            transform: `translate3d(${translateX}, 0, 0)`,
            transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {windowed.map(({ chord, absoluteIndex }) => {
            const isActive = absoluteIndex === activeIndex
            const isPast = absoluteIndex < activeIndex
            return (
              <div
                key={`${absoluteIndex}-${chord}`}
                className={cn(
                  'flex h-14 shrink-0 items-center justify-center rounded-xl border px-2 text-base font-semibold tabular-nums transition-all duration-200',
                  isActive &&
                    'scale-110 border-primary bg-primary text-primary-foreground shadow-md',
                  isPast &&
                    !isActive &&
                    'border-border/50 bg-muted/40 text-muted-foreground opacity-40',
                  !isPast &&
                    !isActive &&
                    'border-border bg-background/80 text-foreground opacity-80'
                )}
                style={{ width: PILL_WIDTH_PX }}
              >
                <span className="truncate">{chord}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
