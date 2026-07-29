'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export type PracticeTutorialStep = 'youtube' | 'line' | null

interface PracticeTutorialCoachProps {
  step: PracticeTutorialStep
  /** CSS selector or element id for the highlighted target */
  targetSelector: string | null
  onNext: () => void
  onSkip: () => void
}

/**
 * Lightweight coachmark: dimmed backdrop + tip card near the highlighted target.
 */
export function PracticeTutorialCoach({
  step,
  targetSelector,
  onNext,
  onSkip,
}: PracticeTutorialCoachProps) {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!step || !targetSelector) {
      setRect(null)
      return
    }

    const update = () => {
      const el = document.querySelector(targetSelector)
      if (!el) {
        setRect(null)
        return
      }
      setRect(el.getBoundingClientRect())
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }

    update()
    const id = window.setInterval(update, 400)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step, targetSelector])

  if (!mounted || !step) return null

  const title =
    step === 'youtube'
      ? t('songContent.practiceTutorialStepVideoTitle')
      : t('songContent.practiceTutorialStepLineTitle')
  const body =
    step === 'youtube'
      ? t('songContent.practiceTutorialStepVideoBody')
      : t('songContent.practiceTutorialStepLineBody')
  const cta =
    step === 'youtube'
      ? t('songContent.practiceTutorialNext')
      : t('songContent.practiceTutorialGotIt')

  const tipTop = rect
    ? Math.min(window.innerHeight - 160, Math.max(72, rect.bottom + 12))
    : 96
  const tipLeft = rect
    ? Math.min(window.innerWidth - 288, Math.max(12, rect.left))
    : 12

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {rect ? (
        <div
          className="absolute rounded-2xl ring-2 ring-white/70 shadow-[0_0_0_9999px_rgba(15,15,15,0.5)] dark:ring-white/40"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        >
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div
        className={cn(
          'pointer-events-auto absolute w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-border',
          'bg-background/95 px-4 py-3 text-foreground shadow-lg backdrop-blur-xl'
        )}
        style={{
          top: tipTop,
          left: tipLeft,
        }}
        role="dialog"
        aria-live="polite"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {step === 'youtube' ? '1 / 2' : '2 / 2'}
        </p>
        <h3 className="mt-1 text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onNext}
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold',
              'bg-foreground text-background transition hover:opacity-90'
            )}
          >
            {cta}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 items-center justify-center rounded-xl px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t('songContent.practiceTutorialSkip')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
