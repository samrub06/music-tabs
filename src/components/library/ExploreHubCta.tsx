'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

interface ExploreHubCtaProps {
  variant?: 'inline' | 'banner'
  className?: string
}

export function ExploreHubCta({ variant = 'banner', className }: ExploreHubCtaProps) {
  const { t } = useLanguage()

  if (variant === 'inline') {
    return (
      <Link
        href="/explore"
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/10 dark:text-violet-300 sm:text-sm',
          className
        )}
      >
        {t('library.hubSeeAllExplore')}
        <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      </Link>
    )
  }

  return (
    <div className={cn('mb-8 mt-1', className)}>
      <Link
        href="/explore"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-4 py-3.5 text-sm font-semibold text-violet-900 shadow-sm transition-all hover:from-violet-500/20 hover:to-fuchsia-500/15 active:scale-[0.99] dark:border-violet-400/25 dark:from-violet-500/15 dark:to-fuchsia-500/10 dark:text-violet-100 sm:max-w-md"
      >
        <span>{t('library.hubSeeAllExplore')}</span>
        <ArrowRightIcon className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
      </Link>
    </div>
  )
}
