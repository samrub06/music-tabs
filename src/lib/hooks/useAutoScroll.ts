import { RefObject, useEffect, useRef } from 'react'
import {
  getViewportInterludeStreak,
  interludePauseMs,
} from '@/utils/interludeLine'

interface UseAutoScrollProps {
  isActive: boolean
  speed: number
  toggleAutoScroll: () => void
  contentRef: RefObject<HTMLDivElement | null>
  /** When true, pause briefly on chord-heavy / interlude lines in the reading band. */
  pauseOnInterlude?: boolean
}

export function useAutoScroll({
  isActive,
  speed,
  toggleAutoScroll,
  contentRef,
  pauseOnInterlude = false,
}: UseAutoScrollProps) {
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseUntilRef = useRef(0)
  const lastInterludeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
      pauseUntilRef.current = 0
      lastInterludeKeyRef.current = null
      return
    }

    scrollIntervalRef.current = setInterval(() => {
      const now = Date.now()

      if (pauseOnInterlude && now < pauseUntilRef.current) {
        return
      }

      if (pauseOnInterlude) {
        const hit = getViewportInterludeStreak(document)
        if (hit) {
          if (hit.key !== lastInterludeKeyRef.current) {
            lastInterludeKeyRef.current = hit.key
            pauseUntilRef.current = now + interludePauseMs(hit.streak)
            return
          }
        } else {
          lastInterludeKeyRef.current = null
        }
      }

      const contentElement = contentRef?.current
      const scrollAmount = speed * 1

      if (contentElement) {
        const maxScrollTop = contentElement.scrollHeight - contentElement.clientHeight

        if (maxScrollTop > 0) {
          contentElement.scrollTop += scrollAmount
          const tolerance = 5
          const isAtBottom = contentElement.scrollTop >= maxScrollTop - tolerance
          if (isAtBottom) toggleAutoScroll()
          return
        }
      }

      const doc = document.scrollingElement || document.documentElement
      const docMaxScroll = doc.scrollHeight - doc.clientHeight
      if (docMaxScroll > 0) {
        doc.scrollTop += scrollAmount
        const tolerance = 5
        if (doc.scrollTop >= docMaxScroll - tolerance) toggleAutoScroll()
      } else {
        toggleAutoScroll()
      }
    }, 50)

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
  }, [isActive, speed, toggleAutoScroll, contentRef, pauseOnInterlude])
}
