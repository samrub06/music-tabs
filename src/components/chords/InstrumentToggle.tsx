'use client'

import { useEffect, useRef, useState } from 'react'
import { Guitar, Piano } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export type ChordInstrument = 'piano' | 'guitar'

interface InstrumentToggleProps {
  value: ChordInstrument
  onChange: (value: ChordInstrument) => void
  className?: string
  /** Hide outer “Instrument” label when placed inline with filter selects */
  compact?: boolean
  /** Show Piano / Guitar text next to icons */
  showLabels?: boolean
  /** After this many ms, collapse to a compact current-instrument pill (default off) */
  autoHideMs?: number
}

export function InstrumentToggle({
  value,
  onChange,
  className,
  compact = false,
  showLabels = false,
  autoHideMs,
}: InstrumentToggleProps) {
  const { t } = useLanguage()
  const [hidden, setHidden] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const scheduleHide = () => {
    if (!autoHideMs || autoHideMs <= 0) return
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => setHidden(true), autoHideMs)
  }

  useEffect(() => {
    if (hidden) return
    scheduleHide()
    return clearHideTimer
    // Restart timer when shown again or value changes while visible
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scheduleHide reads autoHideMs
  }, [hidden, value, autoHideMs])

  const optionClass = (active: boolean) =>
    cn(
      'inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200',
      showLabels
        ? 'h-9 min-w-[5.25rem] px-2.5 text-xs font-medium sm:px-3 sm:text-sm'
        : 'h-9 w-9',
      active
        ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
        : 'text-muted-foreground hover:text-foreground'
    )

  if (autoHideMs && hidden) {
    const isPiano = value === 'piano'
    return (
      <button
        type="button"
        onClick={() => {
          setHidden(false)
        }}
        className={cn(
          'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-muted/80 px-3 text-sm font-medium text-foreground',
          'animate-in fade-in zoom-in-95 duration-200',
          'transition-colors hover:bg-muted',
          className
        )}
        aria-label={t('chords.instrument')}
        aria-expanded={false}
      >
        {isPiano ? (
          <Piano className="h-4 w-4 shrink-0" />
        ) : (
          <Guitar className="h-4 w-4 shrink-0" />
        )}
        {showLabels ? (
          <span>{isPiano ? t('songHeader.piano') : t('songHeader.guitar')}</span>
        ) : null}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center animate-in fade-in zoom-in-95 duration-200',
        compact ? 'shrink-0' : 'gap-2',
        className
      )}
    >
      {!compact && (
        <span className="text-sm font-medium text-muted-foreground">
          {t('chords.instrument')}
        </span>
      )}
      <div
        className="inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full bg-muted/80 p-0.5 dark:bg-gray-800"
        role="group"
        aria-label={t('chords.instrument')}
      >
        <button
          type="button"
          onClick={() => {
            onChange('piano')
            scheduleHide()
          }}
          className={optionClass(value === 'piano')}
          aria-label={t('songHeader.piano')}
          aria-pressed={value === 'piano'}
        >
          <Piano className="h-4 w-4 shrink-0" />
          {showLabels ? <span>{t('songHeader.piano')}</span> : null}
        </button>
        <button
          type="button"
          onClick={() => {
            onChange('guitar')
            scheduleHide()
          }}
          className={optionClass(value === 'guitar')}
          aria-label={t('songHeader.guitar')}
          aria-pressed={value === 'guitar'}
        >
          <Guitar className="h-4 w-4 shrink-0" />
          {showLabels ? <span>{t('songHeader.guitar')}</span> : null}
        </button>
      </div>
    </div>
  )
}
