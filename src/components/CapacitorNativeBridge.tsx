'use client'

import { useEffect } from 'react'

type CapAppPlugin = {
  addListener: (
    event: string,
    cb: (data: { canGoBack?: boolean; url?: string }) => void
  ) => Promise<{ remove: () => void }> | { remove: () => void }
  exitApp: () => Promise<void>
}

type CapWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    Plugins?: {
      App?: CapAppPlugin
      StatusBar?: { setStyle?: (opts: { style: string }) => Promise<void> }
      SplashScreen?: { hide?: () => Promise<void> }
    }
  }
}

/**
 * Additive WebView bridge for the Capacitor shell (Play/App Store).
 * No-ops in normal browsers. Does not change auth, routing, or Server Actions.
 */
export function CapacitorNativeBridge() {
  useEffect(() => {
    const w = window as CapWindow
    if (!w.Capacitor?.isNativePlatform?.()) return

    const App = w.Capacitor.Plugins?.App
    const StatusBar = w.Capacitor.Plugins?.StatusBar
    const SplashScreen = w.Capacitor.Plugins?.SplashScreen

    void StatusBar?.setStyle?.({ style: 'DARK' }).catch(() => undefined)
    void SplashScreen?.hide?.().catch(() => undefined)

    const handles: Array<{ remove: () => void }> = []

    void (async () => {
      if (!App?.addListener) return

      const back = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
        } else {
          void App.exitApp()
        }
      })
      handles.push(back)

      const open = await App.addListener('appUrlOpen', ({ url }) => {
        if (!url) return
        try {
          const parsed = new URL(url)
          if (
            parsed.hostname === 'www.tabascomusic.com' ||
            parsed.hostname === 'tabascomusic.com'
          ) {
            window.location.href = url
          }
        } catch {
          /* ignore */
        }
      })
      handles.push(open)
    })()

    return () => {
      handles.forEach((h) => h.remove())
    }
  }, [])

  return null
}
