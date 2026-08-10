'use client'

import { useEffect, useState } from 'react'

const FALLBACK = '#3f3f46'

export type CoverColorOptions = {
  fallback?: string
  /** 0–1: lower = darker. Banner ~0.42, list tiles ~0.4 */
  mix?: number
}

/**
 * Grayscale-leaning wash with a hint of cover hue, clamped dark so pale
 * covers (e.g. Habad B&W on white) don't produce white card backgrounds.
 */
function toTintedCardBg(r: number, g: number, b: number, mix: number): string {
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const chromaKeep = 0.42
  let tr = gray * (1 - chromaKeep) + r * chromaKeep
  let tg = gray * (1 - chromaKeep) + g * chromaKeep
  let tb = gray * (1 - chromaKeep) + b * chromaKeep

  const m = Math.min(1, Math.max(0.15, mix))
  tr *= m
  tg *= m
  tb *= m

  const lum = (0.2126 * tr + 0.7152 * tg + 0.0722 * tb) / 255
  const maxLum = 0.3
  if (lum > maxLum && lum > 0) {
    const scale = maxLum / lum
    tr *= scale
    tg *= scale
    tb *= scale
  }

  return `rgb(${Math.round(tr)}, ${Math.round(tg)}, ${Math.round(tb)})`
}

function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 242 && g > 242 && b > 242
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
        let rAll = 0
        let gAll = 0
        let bAll = 0
        let nAll = 0
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0
          if (a < 128) continue
          const pr = data[i] ?? 0
          const pg = data[i + 1] ?? 0
          const pb = data[i + 2] ?? 0
          rAll += pr
          gAll += pg
          bAll += pb
          nAll += 1
          // Skip paper-white margins so B&W portraits tint from the subject.
          if (isNearWhite(pr, pg, pb)) continue
          r += pr
          g += pg
          b += pb
          n += 1
        }
        if (nAll === 0) {
          setColor(fallback)
          return
        }
        const useR = n > 0 ? r / n : rAll / nAll
        const useG = n > 0 ? g / n : gAll / nAll
        const useB = n > 0 ? b / n : bAll / nAll
        setColor(toTintedCardBg(useR, useG, useB, mix))
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
