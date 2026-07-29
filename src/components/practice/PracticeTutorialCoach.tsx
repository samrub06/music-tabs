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
          className="absolute rounded-2xl ring-2 ring-[#E8DCC4]/90 shadow-[0_0_0_9999px_rgba(20,16,10,0.45)]"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        >
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-[#E8DCC4]/12" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div
        className="pointer-events-auto absolute w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-white/50 px-4 py-3 shadow-[0_12px_40px_rgba(60,45,25,0.28)]"
        style={{
          top: tipTop,
          left: tipLeft,
          background:
            'linear-gradient(145deg, rgba(248,240,224,0.92), rgba(220,208,184,0.82))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#2F281C',
        }}
        role="dialog"
        aria-live="polite"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B5E48]/90">
          {step === 'youtube' ? '1 / 2' : '2 / 2'}
        </p>
        <h3 className="mt-1 text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#4A4032]/95">{body}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onNext}
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-bold',
              'bg-[#2F281C] text-[#F6EFE2] transition hover:brightness-110'
            )}
          >
            {cta}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 items-center justify-center rounded-xl px-2.5 text-xs font-medium text-[#6B5E48] hover:bg-black/5"
          >
            {t('songContent.practiceTutorialSkip')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
