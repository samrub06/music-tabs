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
        '/folders',
        '/playlists',
        '/playlist',
        '/chords',
        '/leaderboard',
        '/add-song',
        '/ai-playlist',
        '/search/recent',
        '/search/recent-songs',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
