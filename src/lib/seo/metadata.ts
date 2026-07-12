import type { Metadata } from 'next'
import { BRAND_ASSETS, SITE_DESCRIPTION, SITE_NAME } from './site'

type SongSeoInput = {
  title: string
  author: string
  songImageUrl?: string
  artistImageUrl?: string
  userId?: string
}

export const homeMetadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — Chords, Tabs & Songbook`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Chords, Tabs & Songbook`,
    description: SITE_DESCRIPTION,
    type: 'website',
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
    title: `${SITE_NAME} — Chords, Tabs & Songbook`,
    description: SITE_DESCRIPTION,
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
  const image = song.songImageUrl || song.artistImageUrl
  const indexable = !song.userId

  return {
    title,
    description,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'article',
      ...(image ? { images: [{ url: image, alt: `${song.title} cover` }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export function playlistMetadata(playlist: {
  name: string
  description?: string
  imageUrl?: string
  songCount: number
}): Metadata {
  const title = playlist.name
  const description =
    playlist.description?.trim() ||
    `Browse ${playlist.songCount} songs in "${playlist.name}" on ${SITE_NAME}.`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      ...(playlist.imageUrl
        ? { images: [{ url: playlist.imageUrl, alt: playlist.name }] }
        : {}),
    },
    twitter: {
      card: playlist.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(playlist.imageUrl ? { images: [playlist.imageUrl] } : {}),
    },
  }
}

export const privateAreaMetadata: Metadata = {
  robots: { index: false, follow: false },
}
