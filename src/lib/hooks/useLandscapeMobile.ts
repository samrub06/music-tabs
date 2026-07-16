'use client'

import { useEffect, useState } from 'react'

/** Phone in landscape: short viewport height, not tablet/desktop width. */
const PHONE_LANDSCAPE_MAX_HEIGHT = 520
const DESKTOP_MIN_WIDTH = 1024

/**
 * True when the device is a phone held in landscape (narrow height, sub-lg width).
 * Used to keep portrait-like card sizing instead of desktop grid layouts.
 */
export function useLandscapeMobile(): boolean {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches
      const shortHeight = window.innerHeight <= PHONE_LANDSCAPE_MAX_HEIGHT
      const subDesktop = window.innerWidth < DESKTOP_MIN_WIDTH
      setIsLandscapeMobile(landscape && shortHeight && subDesktop)
    }

    update()

    const orientationMq = window.matchMedia('(orientation: landscape)')
    window.addEventListener('resize', update)
    if (typeof orientationMq.addEventListener === 'function') {
      orientationMq.addEventListener('change', update)
      return () => {
        window.removeEventListener('resize', update)
        orientationMq.removeEventListener('change', update)
      }
    }

    orientationMq.addListener(update)
    return () => {
      window.removeEventListener('resize', update)
      orientationMq.removeListener(update)
    }
  }, [])

  return isLandscapeMobile
}
