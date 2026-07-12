'use client'

import { useAuthContext } from '@/context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'

const PENDING_WELCOME_KEY = 'tabasco-pending-welcome'
const ANIMATION_SRC = '/animations/tabasco-intro.mp4'
const DISPLAY_MS = 2000

/** Call before starting OAuth so the welcome animation can play after redirect. */
export function markPendingWelcomeAnimation() {
  try {
    sessionStorage.setItem(PENDING_WELCOME_KEY, '1')
  } catch {
    // ignore quota / private mode
  }
}

function consumePendingWelcomeAnimation(): boolean {
  try {
    const pending = sessionStorage.getItem(PENDING_WELCOME_KEY) === '1'
    if (pending) sessionStorage.removeItem(PENDING_WELCOME_KEY)
    return pending
  } catch {
    return false
  }
}

/**
 * Full-screen brand intro shown once after Google sign-in completes.
 * Stays visible for 2 seconds, then dismisses.
 */
export function PostSignInWelcomeAnimation() {
  const { user, loading } = useAuthContext()
  const [visible, setVisible] = useState(false)
  const dismissedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setVisible(false)
  }, [])

  useEffect(() => {
    if (loading || !user || dismissedRef.current) return
    if (!consumePendingWelcomeAnimation()) return
    setVisible(true)
  }, [loading, user])

  useEffect(() => {
    if (!visible) return
    const video = videoRef.current

    const play = async () => {
      if (!video) return
      try {
        video.currentTime = 0
        await video.play()
      } catch {
        // Autoplay may be blocked; still keep the splash for DISPLAY_MS.
      }
    }
    void play()

    const timer = window.setTimeout(dismiss, DISPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] h-dvh w-screen overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={ANIMATION_SRC}
        playsInline
        muted
        preload="auto"
        onError={dismiss}
      />
    </div>
  )
}
