import type { Metadata } from 'next'

export const SITE_NAME = 'TABasco'

export const SITE_DESCRIPTION =
  'Find, read, transpose, and organize guitar chords and tabs. Israeli, Hebrew, and international songbook — mobile-first, ad-free.'

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3005'
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}

/** Static brand assets in `public/` — keep in sync with logo_tabasco sources. */
export const BRAND_ASSETS = {
  logo: '/logo_tabasco.png',
  logoSvg: '/logo_tabasco.svg',
  icon: '/brand/icon.png',
  appleTouchIcon: '/brand/apple-touch-icon.png',
  /**
   * Opaque full-bleed OG (no transparency). Cache-bust query so messengers
   * that cached the old bordered preview pick up the new file.
   */
  openGraph: '/brand/og-1200x630.png?v=3',
  openGraphSquare: '/brand/og.png?v=3',
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
      { url: `${BRAND_ASSETS.icon}?v=3`, type: 'image/png', sizes: '512x512' },
      { url: '/brand/favicon-32.png?v=3', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: `${BRAND_ASSETS.appleTouchIcon}?v=3`, type: 'image/png', sizes: '180x180' }],
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
