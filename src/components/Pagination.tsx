'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  limit: number
  total: number
  showAllLimit?: number
  className?: string
}

function interpolate(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  )
}

export default function Pagination({ page, limit, total, showAllLimit, className }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canPrev = page > 1
  const canNext = page < totalPages
  const showAllVisible = showAllLimit != null && total > limit
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const progress = totalPages > 1 ? (page / totalPages) * 100 : 100

  const navigate = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', String(nextPage))
    params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleShowAll = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('limit', String(showAllLimit!))
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1 && !showAllVisible) return null

  const pageLabel = interpolate(t('common.pageOf'), { current: page, total: totalPages })
  const rangeLabel = interpolate(t('common.showingRange'), { from, to, total })

  return (
    <nav
      dir={language === 'he' ? 'rtl' : 'ltr'}
      className={cn('mt-4 pb-1', className)}
      aria-label={t('common.pagination')}
    >
      {totalPages > 1 && (
        <div className="space-y-3">
          <div className="flex items-stretch gap-2 sm:justify-center sm:gap-3">
            <button
              type="button"
              className={cn(
                'flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors sm:flex-initial sm:min-w-[7.5rem]',
                canPrev
                  ? 'bg-muted text-foreground active:bg-muted/80'
                  : 'cursor-not-allowed bg-muted/40 text-muted-foreground'
              )}
              onClick={() => navigate(page - 1)}
              disabled={!canPrev}
              aria-label={t('common.previous')}
            >
              <ChevronLeftIcon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{t('common.previous')}</span>
            </button>

            <div className="flex min-w-[5.5rem] flex-col items-center justify-center px-1 text-center">
              <span className="text-sm font-semibold tabular-nums text-foreground">{pageLabel}</span>
              <span className="mt-0.5 text-[11px] tabular-nums text-muted-foreground sm:text-xs">
                {rangeLabel}
              </span>
            </div>

            <button
              type="button"
              className={cn(
                'flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors sm:flex-initial sm:min-w-[7.5rem]',
                canNext
                  ? 'bg-muted text-foreground active:bg-muted/80'
                  : 'cursor-not-allowed bg-muted/40 text-muted-foreground'
              )}
              onClick={() => navigate(page + 1)}
              disabled={!canNext}
              aria-label={t('common.next')}
            >
              <span className="truncate">{t('common.next')}</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </div>

          <div
            className="h-1 overflow-hidden rounded-full bg-muted sm:max-w-md sm:mx-auto"
            role="progressbar"
            aria-valuenow={page}
            aria-valuemin={1}
            aria-valuemax={totalPages}
            aria-label={pageLabel}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {showAllVisible && (
        <Button
          type="button"
          variant="outline"
          className={cn(
            'mt-3 min-h-[44px] w-full',
            totalPages <= 1 && 'mt-0'
          )}
          onClick={handleShowAll}
        >
          {t('common.showAll')}
        </Button>
      )}
    </nav>
  )
}
