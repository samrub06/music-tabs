import { CURATED_PLAYLISTS } from '@/data/curatedPlaylists'
import {
  CURATED_PLAYLIST_COVER_FILES,
  getCuratedPlaylistCoverUrl,
} from '@/data/curatedPlaylistCoverImages'

export type PlaylistCoverOption = {
  slug: string
  name: string
  imageUrl: string | null
  section: string
}

export function getPlaylistCoverOptions(): PlaylistCoverOption[] {
  return CURATED_PLAYLISTS.filter((p) => CURATED_PLAYLIST_COVER_FILES[p.slug]).map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: getCuratedPlaylistCoverUrl(p.slug),
    section: p.section,
  }))
}

export function resolveCoverSlugFromName(name: string): string | null {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null

  if (CURATED_PLAYLIST_COVER_FILES[normalized]) return normalized

  const exact = CURATED_PLAYLISTS.find(
    (p) => CURATED_PLAYLIST_COVER_FILES[p.slug] && p.name.toLowerCase() === normalized
  )
  if (exact) return exact.slug

  const containsMatches = CURATED_PLAYLISTS.filter(
    (p) => CURATED_PLAYLIST_COVER_FILES[p.slug] && normalized.includes(p.name.toLowerCase())
  ).sort((a, b) => b.name.length - a.name.length)
  if (containsMatches[0]) return containsMatches[0].slug

  for (const slug of Object.keys(CURATED_PLAYLIST_COVER_FILES)) {
    const label = slug.replace(/-/g, ' ')
    if (normalized.includes(label) || normalized.includes(slug)) {
      return slug
    }
  }

  return null
}

export function resolveCoverSlugFromGenreId(genreId: string): string | null {
  const match = CURATED_PLAYLISTS.find(
    (p) => p.filter.type === 'genre' && p.filter.value === genreId && CURATED_PLAYLIST_COVER_FILES[p.slug]
  )
  return match?.slug ?? null
}

export function resolveCoverSlugFromSongs(songs: { genre?: string }[]): string | null {
  for (const song of songs) {
    if (song.genre) {
      const slug = resolveCoverSlugFromGenreId(song.genre)
      if (slug) return slug
    }
  }
  return null
}

export function resolveAutoCoverSlug(params: {
  name?: string
  genreId?: string
  songs?: { genre?: string }[]
}): string | null {
  return (
    resolveCoverSlugFromName(params.name ?? '') ??
    (params.genreId ? resolveCoverSlugFromGenreId(params.genreId) : null) ??
    (params.songs ? resolveCoverSlugFromSongs(params.songs) : null)
  )
}

export function getCoverUrlForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null
  return getCuratedPlaylistCoverUrl(slug)
}

export function getPlaylistDisplayCoverUrl(playlist: {
  name: string
  imageUrl?: string
}): string | null {
  if (playlist.imageUrl) return playlist.imageUrl
  const slug = resolveCoverSlugFromName(playlist.name)
  return slug ? getCuratedPlaylistCoverUrl(slug) : null
}

export function resolvePlaylistImageUrl(params: {
  name: string
  coverSlug?: string
  genreId?: string
  songs?: { genre?: string }[]
}): string | undefined {
  const slug =
    params.coverSlug ??
    resolveAutoCoverSlug({
      name: params.name,
      genreId: params.genreId,
      songs: params.songs,
    })
  return getCoverUrlForSlug(slug) ?? undefined
}
