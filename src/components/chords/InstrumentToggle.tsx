'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'
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
  /** Show Piano / Guitar text next to icons (until auto-collapse) */
  showLabels?: boolean
  /** After this many ms, collapse to icons-only (default off) */
  autoHideMs?: number
  /** Scroll container: any scroll collapses labels to icons-only */
  scrollRootRef?: RefObject<HTMLElement | null>
}

export function InstrumentToggle({
  value,
  onChange,
  className,
  compact = false,
  showLabels = false,
  autoHideMs,
  scrollRootRef,
}: InstrumentToggleProps) {
  const { t } = useLanguage()
  const [labelsVisible, setLabelsVisible] = useState(showLabels)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const collapseLabels = () => {
    if (!showLabels) return
    setLabelsVisible(false)
    clearHideTimer()
  }

  // Reset when showLabels prop changes (e.g. remount / song change)
  useEffect(() => {
    setLabelsVisible(showLabels)
  }, [showLabels])

  // Timer: after a few seconds → icons only
  useEffect(() => {
    if (!showLabels || !labelsVisible || !autoHideMs || autoHideMs <= 0) return
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setLabelsVisible(false)
    }, autoHideMs)
    return clearHideTimer
  }, [showLabels, labelsVisible, autoHideMs])

  // Scroll on song section → icons only
  useEffect(() => {
    if (!showLabels || !labelsVisible) return
    const root = scrollRootRef?.current
    if (!root) return

    const onScroll = () => collapseLabels()
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- collapse once labels are visible
  }, [showLabels, labelsVisible, scrollRootRef])

  const displayLabels = showLabels && labelsVisible

  const optionClass = (active: boolean) =>
    cn(
      'inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200',
      displayLabels
        ? 'h-9 min-w-[5.25rem] px-2.5 text-xs font-medium sm:px-3 sm:text-sm'
        : 'h-9 w-9',
      active
        ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
        : 'text-muted-foreground hover:text-foreground'
    )

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
          onClick={() => onChange('piano')}
          className={optionClass(value === 'piano')}
          aria-label={t('songHeader.piano')}
          aria-pressed={value === 'piano'}
        >
          <Piano className="h-4 w-4 shrink-0" />
          {displayLabels ? <span>{t('songHeader.piano')}</span> : null}
        </button>
        <button
          type="button"
          onClick={() => onChange('guitar')}
          className={optionClass(value === 'guitar')}
          aria-label={t('songHeader.guitar')}
          aria-pressed={value === 'guitar'}
        >
          <Guitar className="h-4 w-4 shrink-0" />
          {displayLabels ? <span>{t('songHeader.guitar')}</span> : null}
        </button>
      </div>
    </div>
  )
}
