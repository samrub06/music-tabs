'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe landscape orientation detection via matchMedia.
 * Returns false on the server and until mounted.
 */
export function useLandscapePractice(): { isLandscape: boolean } {
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(orientation: landscape)')
    const update = () => setIsLandscape(mediaQuery.matches)

    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    // Safari < 14
    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return { isLandscape }
}
