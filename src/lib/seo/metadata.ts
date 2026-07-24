import type { Metadata } from 'next'
import {
  absoluteUrl,
  BRAND_ASSETS,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
} from './site'

type SongSeoInput = {
  id?: string
  title: string
  author: string
  songImageUrl?: string
  artistImageUrl?: string
  userId?: string
}

/** Prefer a larger iTunes/mzstatic artwork when the stored URL is a tiny thumbnail. */
export function preferLargeCoverUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('mzstatic.com')) return url
    parsed.pathname = parsed.pathname.replace(
      /\/\d+x\d+[a-z]*(\.[a-z]+)$/i,
      '/1200x1200bb$1'
    )
    return parsed.toString()
  } catch {
    return url
  }
}

/** Ensure OG crawlers always get an absolute https URL when possible. */
export function toAbsoluteOgImageUrl(imageUrl: string): string {
  const enlarged = preferLargeCoverUrl(imageUrl.trim())
  try {
    const parsed = new URL(enlarged)
    if (parsed.protocol === 'http:') parsed.protocol = 'https:'
    return parsed.toString()
  } catch {
    // Relative path → resolve against metadataBase / site URL
    return absoluteUrl(enlarged.startsWith('/') ? enlarged : `/${enlarged}`)
  }
}

export const homeMetadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: 'website',
    images: [
      {
        url: BRAND_ASSETS.openGraph,
        width: 1200,
        height: 630,
        alt: HOME_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [BRAND_ASSETS.openGraph],
  },
  robots: { index: true, follow: true },
}

export const exploreMetadata: Metadata = {
  title: 'Explore',
  description:
    'Browse trending international songs, chords, and tabs. Filter by genre, decade, and difficulty.',
  openGraph: {
    title: 'Explore',
    description:
      'Browse trending international songs, chords, and tabs. Filter by genre, decade, and difficulty.',
  },
}

export function songMetadata(song: SongSeoInput): Metadata {
  const title = `${song.title} — ${song.author}`
  const description = `Chords and lyrics for "${song.title}" by ${song.author}. Transpose, autoscroll, and practice on ${SITE_NAME}.`
  const rawImage = song.songImageUrl || song.artistImageUrl
  const coverImage = rawImage ? toAbsoluteOgImageUrl(rawImage) : null
  const fallbackImage = absoluteUrl(BRAND_ASSETS.openGraph)
  const image = coverImage || fallbackImage
  const indexable = !song.userId
  const pageUrl = song.id ? absoluteUrl(`/song/${song.id}`) : undefined

  return {
    title,
    description,
    alternates: pageUrl ? { canonical: pageUrl } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'article',
      url: pageUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: coverImage ? 1200 : 630,
          alt: coverImage ? `${song.title} cover` : SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function playlistMetadata(playlist: {
  id?: string
  name: string
  description?: string
  imageUrl?: string
  songCount: number
}): Metadata {
  const title = playlist.name
  const description =
    playlist.description?.trim() ||
    `Browse ${playlist.songCount} songs in "${playlist.name}" on ${SITE_NAME}.`
  const coverImage = playlist.imageUrl
    ? toAbsoluteOgImageUrl(playlist.imageUrl)
    : null
  const image = coverImage || absoluteUrl(BRAND_ASSETS.openGraph)
  const pageUrl = playlist.id ? absoluteUrl(`/jams/${playlist.id}`) : undefined

  return {
    title,
    description,
    alternates: pageUrl ? { canonical: pageUrl } : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: coverImage ? 1200 : 630,
          alt: coverImage ? playlist.name : SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export const privateAreaMetadata: Metadata = {
  robots: { index: false, follow: false },
}
