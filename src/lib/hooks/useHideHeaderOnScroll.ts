'use client'

import { useScrollChromeOptional } from '@/context/ScrollChromeContext'
import { useEffect, useRef, type RefObject } from 'react'

const SCROLL_THRESHOLD = 8
const TOP_REVEAL_OFFSET = 24

export function useHideHeaderOnScroll(
  scrollRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const scrollChrome = useScrollChromeOptional()
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!scrollChrome) return

    const { setHeaderHidden } = scrollChrome

    if (!enabled) {
      setHeaderHidden(false)
      return
    }

    const element = scrollRef.current
    if (!element) return

    const onScroll = () => {
      const scrollTop = element.scrollTop
      const delta = scrollTop - lastScrollTop.current

      if (scrollTop <= TOP_REVEAL_OFFSET) {
        setHeaderHidden(false)
      } else if (delta > SCROLL_THRESHOLD) {
        setHeaderHidden(true)
      } else if (delta < -SCROLL_THRESHOLD) {
        setHeaderHidden(false)
      }

      lastScrollTop.current = scrollTop
    }

    element.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', onScroll)
      setHeaderHidden(false)
    }
  }, [enabled, scrollRef, scrollChrome])
}
