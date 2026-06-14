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

/** Static brand assets in `public/brand/` — export from design, do not generate from SVG at runtime. */
export const BRAND_ASSETS = {
  icon: '/brand/icon.png',
  appleTouchIcon: '/brand/apple-touch-icon.png',
  openGraph: '/brand/og.png',
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
    icon: [{ url: BRAND_ASSETS.icon, type: 'image/png' }],
    apple: [{ url: BRAND_ASSETS.appleTouchIcon, type: 'image/png' }],
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
