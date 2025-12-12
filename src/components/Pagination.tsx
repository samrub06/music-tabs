'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  page: number
  limit: number
  total: number
}

export default function Pagination({ page, limit, total }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canPrev = page > 1
  const canNext = page < totalPages

  const navigate = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', String(nextPage))
    params.set('limit', String(limit))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
        onClick={() => navigate(page - 1)}
        disabled={!canPrev}
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} / {totalPages}
      </span>
      <button
        className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
        onClick={() => navigate(page + 1)}
        disabled={!canNext}
      >
        Next
      </button>
    </div>
  )
}




