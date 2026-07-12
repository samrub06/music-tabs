'use client'

import { useAuthContext } from '@/context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'

const PENDING_WELCOME_KEY = 'tabasco-pending-welcome'
const ANIMATION_SRC = '/animations/tabasco-intro.mp4'

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
    if (!video) return

    const play = async () => {
      try {
        video.currentTime = 0
        await video.play()
      } catch {
        // Autoplay may be blocked; tap anywhere to skip.
      }
    }
    void play()

    const fallback = window.setTimeout(dismiss, 8000)
    return () => window.clearTimeout(fallback)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
      onClick={dismiss}
    >
      <video
        ref={videoRef}
        className="max-h-full max-w-full object-contain"
        src={ANIMATION_SRC}
        playsInline
        muted
        preload="auto"
        onEnded={dismiss}
        onError={dismiss}
      />
    </div>
  )
}
