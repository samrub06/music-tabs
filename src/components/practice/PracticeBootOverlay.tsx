'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface PracticeBootOverlayProps {
  open: boolean
}

/** Full-screen boot veil while Try-it opens YouTube + practice chip. */
export function PracticeBootOverlay({ open }: PracticeBootOverlayProps) {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1610]/55 px-6 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/45 px-6 py-7 text-center shadow-[0_20px_50px_rgba(40,30,15,0.35)] ring-1 ring-inset ring-white/35 backdrop-blur-xl backdrop-saturate-150"
        style={{
          background:
            'linear-gradient(145deg, rgba(245,236,218,0.88), rgba(214,200,172,0.72))',
          color: '#2F281C',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-1/2 rounded-b-full bg-gradient-to-b from-white/50 to-transparent"
        />
        <div
          className="relative mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#2F281C]/20 border-t-[#2F281C]"
          aria-hidden
        />
        <p className="relative text-base font-semibold tracking-tight">
          {t('songContent.practiceVideoLoading')}
        </p>
        <p className="relative mt-1.5 text-sm text-[#4A4032]/90">
          {t('songContent.practiceVideoLoadingHint')}
        </p>
      </div>
    </div>,
    document.body
  )
}
