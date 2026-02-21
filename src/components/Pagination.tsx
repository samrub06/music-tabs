'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

interface PaginationProps {
  page: number
  limit: number
  total: number
  showAllLimit?: number
}

export default function Pagination({ page, limit, total, showAllLimit }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canPrev = page > 1
  const canNext = page < totalPages
  const showAllVisible = showAllLimit != null && total > limit

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

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {totalPages > 1 && (
        <>
          <button
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
            onClick={() => navigate(page - 1)}
            disabled={!canPrev}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
            onClick={() => navigate(page + 1)}
            disabled={!canNext}
          >
            Next
          </button>
        </>
      )}
      {showAllVisible && (
        <button
          type="button"
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={handleShowAll}
        >
          {t('common.showAll')}
        </button>
      )}
    </div>
  )
}




