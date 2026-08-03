'use client'

import { useEffect, useRef } from 'react'

/**
 * Observes a sentinel element near the bottom of a list and calls `onLoadMore`
 * when it intersects (infinite scroll / scroll pagination).
 */
export function useInfiniteScrollLoadMore(options: {
  enabled: boolean
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  /** Optional scroll container; defaults to the viewport. */
  root?: Element | null
  rootMargin?: string
}) {
  const {
    enabled,
    hasMore,
    loading,
    onLoadMore,
    root = null,
    rootMargin = '240px 0px',
  } = options
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  const loadingRef = useRef(loading)
  loadingRef.current = loading

  useEffect(() => {
    if (!enabled || !hasMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (loadingRef.current) return
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMoreRef.current()
        }
      },
      { root, rootMargin, threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, hasMore, root, rootMargin])

  return sentinelRef
}
