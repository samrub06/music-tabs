import type { Metadata } from 'next'

export const SITE_NAME = 'TABasco'

export const SITE_DESCRIPTION =
  'Find, read, transpose, and organize guitar chords and tabs. Israeli, Hebrew, and international songbook — mobile-first, ad-free.'

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || null
  const vercelUrl = vercelHost ? `https://${vercelHost.replace(/^https?:\/\//, '')}` : null

  // Prefer a real public URL. Localhost in NEXT_PUBLIC_SITE_URL breaks OG on Vercel.
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv
  }
  if (vercelUrl) return vercelUrl
  if (fromEnv) return fromEnv
  return 'http://localhost:3005'
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}

/** Static brand assets in `public/` — keep in sync with media/logo_tabasco* sources. */
export const BRAND_ASSETS = {
  logo: '/logo_tabasco.png',
  logoSvg: '/logo_tabasco.svg',
  logoText: '/logo_tabasco_text.png',
  icon: '/brand/icon.png',
  appleTouchIcon: '/brand/apple-touch-icon.png',
  /**
   * Opaque dark full-bleed OG (no white plate). Cache-bust when logo changes.
   */
  openGraph: '/brand/og-1200x630.png?v=4',
  openGraphSquare: '/brand/og.png?v=4',
} as const

export const defaultMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: `${BRAND_ASSETS.icon}?v=4`, type: 'image/png', sizes: '512x512' },
      { url: '/brand/favicon-32.png?v=4', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: `${BRAND_ASSETS.appleTouchIcon}?v=4`, type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: BRAND_ASSETS.openGraph,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [BRAND_ASSETS.openGraph],
  },
  robots: {
    index: true,
    follow: true,
  },
}
