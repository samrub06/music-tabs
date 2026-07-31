import { absoluteShareUrl, absoluteUrl } from './site'

export { absoluteUrl }

/** Public song path: prefer SEO slug when available. */
export function songPath(song: { id: string; slug?: string | null }): string {
  const key = song.slug?.trim() || song.id
  return `/song/${key}`
}

export function absoluteSongUrl(song: { id: string; slug?: string | null }): string {
  return absoluteUrl(songPath(song))
}

export function absoluteSongShareUrl(song: { id: string; slug?: string | null }): string {
  return absoluteShareUrl(songPath(song))
}

export function artistPath(authorSlug: string): string {
  return `/artist/${authorSlug}`
}

export function absoluteArtistUrl(authorSlug: string): string {
  return absoluteUrl(artistPath(authorSlug))
}
