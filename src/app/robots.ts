import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/profile',
        '/songs',
        '/playlists',
        '/jams',
        '/chords',
        '/leaderboard',
        '/add-song',
        '/search/recent',
        '/search/recent-songs',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
