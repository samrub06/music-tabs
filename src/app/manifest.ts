import type { MetadataRoute } from 'next'
import {
  BRAND_ASSETS,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/seo/site'

/**
 * Web app manifest for installability (PWA). Additive — does not change
 * app behavior for normal browser users or Vercel hosting.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} Music`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'en',
    categories: ['music', 'education', 'entertainment'],
    icons: [
      {
        src: BRAND_ASSETS.icon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: BRAND_ASSETS.icon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: BRAND_ASSETS.appleTouchIcon,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
