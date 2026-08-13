import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Capacitor } from '@capacitor/core'

/**
 * Native polish loaded when the shell boots on device.
 * Safe no-ops in browser; Capacitor injects this via the WebView bridge
 * when using a remote URL only if you inject via native — for remote URL
 * mode, StatusBar/Splash are configured in capacitor.config.ts plugins.
 *
 * This module is kept for local www debugging / future bundled shell.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0a0a0a' })
    }
  } catch {
    /* plugin unavailable */
  }

  try {
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      void App.exitApp()
    }
  })

  App.addListener('appUrlOpen', ({ url }) => {
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
}
