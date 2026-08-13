import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell for TABasco. The WebView loads the live Vercel site —
 * Next.js deploy pipeline is unchanged.
 */
const config: CapacitorConfig = {
  appId: 'com.tabascomusic.app',
  appName: 'TABasco',
  webDir: 'www',
  server: {
    url: 'https://www.tabascomusic.com',
    cleartext: false,
    allowNavigation: [
      'tabascomusic.com',
      '*.tabascomusic.com',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0a',
  },
  ios: {
    backgroundColor: '#0a0a0a',
    contentInset: 'automatic',
    scheme: 'TABasco',
  },
}

export default config
