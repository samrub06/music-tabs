'use client'

import Image from 'next/image'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

/** Parchment tone sampled from media/pratice.png */
const BANNER_BG = '#D0C8B0'
const BANNER_INK = '#2A2418'

const STORAGE_DISMISSED = 'tabasco:practice-promo-dismissed-v2'
const STORAGE_COLLAPSED = 'tabasco:practice-promo-collapsed-v2'
const BANNER_DURATION_MS = 10_000
/** Pause after snake fills so the close icon is visible before collapsing. */
const READY_HOLD_MS = 900
const COLLAPSE_DURATION_MS = 420

export type PracticePromoPhase =
  | 'loading'
  | 'banner'
  | 'ready'
  | 'collapsing'
  | 'chip'
  | 'gone'

function readStorageFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeStorageFlag(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Practice promo flow: chip in the toolbar until permanently dismissed.
 * (Hero banner kept in file for reuse; song page uses chip-only.)
 */
export function usePracticeComingSoonPromo() {
  const [phase, setPhase] = useState<PracticePromoPhase>('loading')

  useEffect(() => {
    if (readStorageFlag(STORAGE_DISMISSED)) {
      setPhase('gone')
      return
    }
    writeStorageFlag(STORAGE_COLLAPSED)
    setPhase('chip')
  }, [])

  const dismiss = useCallback(() => {
    writeStorageFlag(STORAGE_DISMISSED)
    writeStorageFlag(STORAGE_COLLAPSED)
    setPhase('gone')
  }, [])

  /** Snake finished filling → show close icon on the banner. */
  const markBannerReady = useCallback(() => {
    setPhase((current) => (current === 'banner' ? 'ready' : current))
  }, [])

  /** Collapse banner → persistent chip. */
  const collapseToChip = useCallback(() => {
    writeStorageFlag(STORAGE_COLLAPSED)
    setPhase((current) =>
      current === 'ready' || current === 'banner' ? 'collapsing' : current
    )
  }, [])

  /** @deprecated Chip no longer reopens the banner; kept for API compat. */
  const reopenBanner = useCallback(() => {
    // no-op: promos stay as chips only
  }, [])

  // After close icon is shown, auto-collapse to chip
  useEffect(() => {
    if (phase !== 'ready') return
    const id = window.setTimeout(collapseToChip, READY_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase, collapseToChip])

  useEffect(() => {
    if (phase !== 'collapsing') return
    const id = window.setTimeout(() => setPhase('chip'), COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  return { phase, dismiss, markBannerReady, collapseToChip, reopenBanner }
}

interface PracticeComingSoonBannerProps {
  phase: PracticePromoPhase
  onSnakeFilled: () => void
  onDismiss: () => void
}

/**
 * Spotify-style promo banner. Snake fills 10s → close icon → collapses to chip.
 */
export function PracticeComingSoonBanner({
  phase,
  onSnakeFilled,
  onDismiss,
}: PracticeComingSoonBannerProps) {
  const { t } = useLanguage()
  const showClose = phase === 'ready' || phase === 'collapsing'
  const visible = phase === 'banner' || phase === 'ready' || phase === 'collapsing'

  useEffect(() => {
    if (phase !== 'banner') return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const id = window.setTimeout(onSnakeFilled, reduced ? 0 : BANNER_DURATION_MS)
    return () => window.clearTimeout(id)
  }, [phase, onSnakeFilled])

  if (!visible) return null

  return (
    <div
      className={cn(
        'relative w-full origin-top transition-all duration-[420ms] ease-out',
        phase === 'collapsing'
          ? 'pointer-events-none max-h-0 -translate-y-2 scale-90 opacity-0'
          : 'max-h-48 translate-y-0 scale-100 opacity-100'
      )}
      style={{ ['--promo-snake-color' as string]: BANNER_INK }}
    >
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ backgroundColor: BANNER_BG }}
      >
        <span
          aria-hidden
          className={cn(
            'promo-snake-border pointer-events-none absolute inset-0 rounded-xl',
            // Keep border fully filled once ready (no re-run of 10s anim)
            (phase === 'ready' || phase === 'collapsing') && 'promo-snake-border-filled'
          )}
        />

        <div className="relative z-10 min-h-[8.5rem] sm:min-h-[9.5rem]">
          {showClose ? (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute end-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-black/10 backdrop-blur-sm transition-colors hover:bg-black/20 animate-in fade-in zoom-in-95 duration-200 sm:end-3 sm:top-3 sm:h-9 sm:w-9"
              style={{ color: BANNER_INK }}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : (
            <span
              role="status"
              className="absolute end-2.5 top-2.5 z-20 rounded-full border border-black/15 bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]"
              style={{ color: BANNER_INK }}
            >
              {t('common.comingSoon')}
            </span>
          )}

          <div
            className="pointer-events-none absolute inset-y-0 end-0 w-1/2 overflow-hidden"
            aria-hidden
          >
            <div className="absolute -bottom-10 -end-4 sm:-bottom-14 sm:-end-2">
              <Image
                src="/pratice.png"
                alt=""
                width={512}
                height={512}
                className="h-44 w-auto max-w-none rotate-[18deg] object-contain drop-shadow-md sm:h-56"
              />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[8.5rem] flex-col items-start justify-between p-5 sm:min-h-[9.5rem] sm:p-6">
            <div className="flex min-w-0 max-w-[50%] flex-col items-start pr-2 sm:max-w-[52%]">
              <h2
                className="text-base font-semibold tracking-tight sm:text-lg"
                style={{ color: BANNER_INK }}
              >
                {t('songContent.practiceBannerTitle')}
              </h2>
              <p
                className="mt-1.5 text-[11px] font-medium leading-relaxed opacity-80 min-[400px]:text-xs sm:mt-2 sm:max-w-sm sm:text-sm"
                style={{ color: BANNER_INK }}
              >
                {t('songContent.practiceBannerDescription')}
              </p>
            </div>

            <div className="mt-3 shrink-0 sm:mt-4">
              <button
                type="button"
                disabled
                className="inline-flex cursor-default items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
                style={{ backgroundColor: BANNER_INK, color: BANNER_BG }}
              >
                {t('songContent.practiceBannerCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PracticeComingSoonChipProps {
  visible: boolean
  onDismiss?: () => void
}

/** Compact chip — X permanently dismisses (hides chip, no banner). Feature stays disabled. */
export function PracticeComingSoonChip({
  visible,
  onDismiss,
}: PracticeComingSoonChipProps) {
  const { t } = useLanguage()

  if (!visible) return null

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 py-1.5 pe-1 ps-2.5 animate-in fade-in zoom-in-95 duration-300 sm:gap-1.5 sm:px-1 sm:ps-3',
        'min-h-9 sm:min-h-[40px]'
      )}
      style={{ backgroundColor: BANNER_BG, color: BANNER_INK }}
      role="status"
    >
      <span
        className="max-w-[7.5rem] truncate text-left text-xs font-semibold tracking-tight sm:max-w-none sm:text-sm"
        title={t('songContent.practiceBannerTitle')}
      >
        {t('songContent.practiceBannerTitle')}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10 sm:h-8 sm:w-8"
        aria-label={t('common.close')}
        title={t('common.close')}
      >
        <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  )
}
