'use client'

import Image from 'next/image'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

/** Charcoal sampled from media/mic.png */
const BANNER_BG = '#1A1A1A'
const BANNER_INK = '#F5F5F5'
const SNAKE_COLOR = '#DC2626'

const STORAGE_DISMISSED = 'tabasco:record-promo-dismissed-v2'
const STORAGE_COLLAPSED = 'tabasco:record-promo-collapsed-v2'
const BANNER_DURATION_MS = 10_000
const READY_HOLD_MS = 900
const COLLAPSE_DURATION_MS = 420

export type RecordPromoPhase =
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

function clearStorageFlag(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Record-song promo: banner + 10s snake → close → chip (same flow as practice).
 * Chip click reopens the banner; feature CTA stays disabled for now.
 */
export function useRecordSongPromo() {
  const [phase, setPhase] = useState<RecordPromoPhase>('loading')

  useEffect(() => {
    if (readStorageFlag(STORAGE_DISMISSED)) {
      setPhase('gone')
      return
    }
    if (readStorageFlag(STORAGE_COLLAPSED)) {
      setPhase('chip')
      return
    }
    setPhase('banner')
  }, [])

  const dismiss = useCallback(() => {
    writeStorageFlag(STORAGE_DISMISSED)
    writeStorageFlag(STORAGE_COLLAPSED)
    setPhase('gone')
  }, [])

  const markBannerReady = useCallback(() => {
    setPhase((current) => (current === 'banner' ? 'ready' : current))
  }, [])

  const collapseToChip = useCallback(() => {
    writeStorageFlag(STORAGE_COLLAPSED)
    setPhase((current) =>
      current === 'ready' || current === 'banner' ? 'collapsing' : current
    )
  }, [])

  const reopenBanner = useCallback(() => {
    clearStorageFlag(STORAGE_COLLAPSED)
    setPhase('banner')
  }, [])

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

interface RecordSongBannerProps {
  phase: RecordPromoPhase
  onSnakeFilled: () => void
  onDismiss: () => void
  onStartRecording: () => void
  isRecording?: boolean
  disabled?: boolean
}

/**
 * Hero promo for recording — mic.png on the right (≤ half width), dark panel, red CTA.
 */
export function RecordSongBanner({
  phase,
  onSnakeFilled,
  onDismiss,
  onStartRecording,
  isRecording = false,
  disabled = false,
}: RecordSongBannerProps) {
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
      style={{ ['--promo-snake-color' as string]: SNAKE_COLOR }}
    >
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ backgroundColor: BANNER_BG }}
      >
        <span
          aria-hidden
          className={cn(
            'promo-snake-border pointer-events-none absolute inset-0 rounded-xl',
            (phase === 'ready' || phase === 'collapsing') && 'promo-snake-border-filled'
          )}
        />

        <div className="relative z-10 min-h-[8.5rem] sm:min-h-[9.5rem]">
          {showClose ? (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute end-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 animate-in fade-in zoom-in-95 duration-200 sm:end-3 sm:top-3 sm:h-9 sm:w-9"
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : isRecording ? (
            <span
              role="status"
              className="absolute end-2.5 top-2.5 z-20 rounded-full border border-red-400/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300 backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]"
            >
              {t('songContent.recordingBannerRecording')}
            </span>
          ) : (
            <span
              role="status"
              className="absolute end-2.5 top-2.5 z-20 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]"
            >
              {t('songContent.recordingBannerTitle')}
            </span>
          )}

          {/* Decorative mic capped at half width so left copy stays clear */}
          <div
            className="pointer-events-none absolute inset-y-0 end-0 w-1/2 overflow-hidden"
            aria-hidden
          >
            <div className="absolute -bottom-6 -end-8 sm:-bottom-8 sm:-end-6">
              <Image
                src="/mic.png"
                alt=""
                width={1280}
                height={720}
                className="h-40 w-auto max-w-none object-contain object-right drop-shadow-lg sm:h-52"
                priority={false}
              />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[8.5rem] flex-col items-start justify-between p-5 sm:min-h-[9.5rem] sm:p-6">
            <div className="flex min-w-0 max-w-[50%] flex-col items-start pr-2 sm:max-w-[52%]">
              <h2
                className="text-base font-semibold tracking-tight sm:text-lg"
                style={{ color: BANNER_INK }}
              >
                {t('songContent.recordingBannerTitle')}
              </h2>
              <p
                className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/75 min-[400px]:text-xs sm:mt-2 sm:max-w-sm sm:text-sm"
              >
                {t('songContent.recordingBannerDescription')}
              </p>
            </div>

            <div className="mt-3 shrink-0 sm:mt-4">
              <button
                type="button"
                disabled
                className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-red-600/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white opacity-90 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
              >
                {t('common.comingSoon')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RecordSongChipProps {
  visible: boolean
  onReopen?: () => void
}

/** Compact chip — click label or X to reopen the banner. Feature stays disabled. */
export function RecordSongChip({
  visible,
  onReopen,
}: RecordSongChipProps) {
  const { t } = useLanguage()

  if (!visible) return null

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full border border-red-500/25 bg-red-600/10 py-1.5 pe-1 ps-2.5 animate-in fade-in zoom-in-95 duration-300 sm:gap-1 sm:ps-3',
        'min-h-9 sm:min-h-[40px]'
      )}
      role="status"
    >
      <button
        type="button"
        onClick={onReopen}
        className="max-w-[7.5rem] truncate text-left text-xs font-semibold tracking-tight text-red-700 transition-opacity hover:opacity-80 dark:text-red-400 sm:max-w-none sm:text-sm"
        title={t('songContent.recordingBannerTitle')}
      >
        {t('songContent.recordingBannerTitle')}
      </button>
      <button
        type="button"
        onClick={onReopen}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-700/80 transition-colors hover:bg-red-500/15 dark:text-red-400 sm:h-8 sm:w-8"
        aria-label={t('songContent.recordingBannerTitle')}
        title={t('songContent.recordingBannerTitle')}
      >
        <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  )
}
