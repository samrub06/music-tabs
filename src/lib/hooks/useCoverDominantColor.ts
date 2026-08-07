'use client'

import { useEffect, useState } from 'react'

const FALLBACK = '#3f3f46'

export type CoverColorOptions = {
  fallback?: string
  /** 0–1: lower = darker. Banner ~0.42, list tiles ~0.55 */
  mix?: number
}

function mixRgb(r: number, g: number, b: number, mix: number): string {
  const m = Math.min(1, Math.max(0.15, mix))
  return `rgb(${Math.round(r * m)}, ${Math.round(g * m)}, ${Math.round(b * m)})`
}

/**
 * Average a downscaled cover into a tinted RGB background.
 * Falls back when the image is missing or canvas is tainted (CORS).
 */
export function useCoverDominantColor(
  coverUrl: string | null | undefined,
  options: CoverColorOptions = {}
): string {
  const fallback = options.fallback ?? FALLBACK
  const mix = options.mix ?? 0.42
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    if (!coverUrl) {
      setColor(fallback)
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    img.onload = () => {
      if (cancelled) return
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          setColor(fallback)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0
          if (a < 128) continue
          r += data[i] ?? 0
          g += data[i + 1] ?? 0
          b += data[i + 2] ?? 0
          n += 1
        }
        if (n === 0) {
          setColor(fallback)
          return
        }
        setColor(mixRgb(r / n, g / n, b / n, mix))
      } catch {
        setColor(fallback)
      }
    }

    img.onerror = () => {
      if (!cancelled) setColor(fallback)
    }

    img.src = coverUrl

    return () => {
      cancelled = true
    }
  }, [coverUrl, fallback, mix])

  return color
}
