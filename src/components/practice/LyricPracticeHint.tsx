'use client'

import { useCallback, useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MusicalNoteIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'tabasco:lyric-practice-hint-dismissed-v1'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

interface LyricPracticeHintProps {
  visible: boolean
  className?: string
}

/**
 * First-time tip: click a lyric line to seek YouTube (video or audio bubble).
 */
export function LyricPracticeHint({ visible, className }: LyricPracticeHintProps) {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(readDismissed())
  }, [])

  const dismiss = useCallback(() => {
    writeDismissed()
    setDismissed(true)
  }, [])

  if (!visible || dismissed) return null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3.5 dark:border-red-400/20 dark:bg-red-500/[0.12]',
        className
      )}
      role="status"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute end-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        aria-label={t('common.close')}
        title={t('common.close')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pe-8">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
          <MusicalNoteIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t('songContent.lyricPracticeHintTitle')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t('songContent.lyricPracticeHintDescription')}
          </p>
          <p className="mt-2 text-[11px] font-medium text-red-700 dark:text-red-300 sm:text-xs">
            {t('songContent.lyricPracticeHintTip')}
          </p>
        </div>
      </div>
    </div>
  )
}
