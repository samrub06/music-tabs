import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'
import {
  getPublicArtistSitemapEntries,
  getPublicPlaylistSitemapEntries,
  getPublicSongSitemapEntries,
} from '@/lib/seo/sitemapData'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [songs, playlists, artists] = await Promise.all([
    getPublicSongSitemapEntries(),
    getPublicPlaylistSitemapEntries(),
    getPublicArtistSitemapEntries(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/explore'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const songRoutes: MetadataRoute.Sitemap = songs.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const playlistRoutes: MetadataRoute.Sitemap = playlists.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const artistRoutes: MetadataRoute.Sitemap = artists.map((entry) => ({
    url: entry.url,
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  return [...staticRoutes, ...playlistRoutes, ...artistRoutes, ...songRoutes]
}
