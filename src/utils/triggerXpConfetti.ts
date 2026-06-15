import confetti from 'canvas-confetti'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type XpConfettiIntensity = 'standard' | 'levelUp'

export function triggerXpConfetti(intensity: XpConfettiIntensity = 'standard'): void {
  if (prefersReducedMotion()) return

  const defaults = {
    origin: { y: 0.55, x: 0.5 },
    zIndex: 10000,
    disableForReducedMotion: true,
  }

  if (intensity === 'standard') {
    confetti({
      ...defaults,
      particleCount: 60,
      spread: 70,
      startVelocity: 30,
      scalar: 0.85,
      ticks: 120,
      colors: ['#f59e0b', '#fbbf24', '#22c55e', '#ef4444'],
    })
    return
  }

  confetti({
    ...defaults,
    particleCount: 80,
    spread: 55,
    startVelocity: 40,
    scalar: 1,
    ticks: 160,
  })

  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      spread: 100,
      startVelocity: 32,
      scalar: 0.9,
      colors: ['#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#ec4899'],
    })
  }, 150)
}
