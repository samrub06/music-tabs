import {
  CURATED_PLAYLISTS,
  curatedPlaylistSectionBySlug,
  getHubZoneForSlug,
} from '@/data/curatedPlaylists'
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
  curatedSlug?: string | null
}): string | null {
  if (playlist.imageUrl) return playlist.imageUrl
  if (playlist.curatedSlug) {
    const curatedUrl = getCuratedPlaylistCoverUrl(playlist.curatedSlug)
    if (curatedUrl) return curatedUrl
  }
  const slug = resolveCoverSlugFromName(playlist.name)
  return slug ? getCuratedPlaylistCoverUrl(slug) : null
}

/**
 * Jewish / Israeli curated playlists keep covers when tsniout is on
 * (section `jewish` or hub `songbook` / `israeli` — mirrors hebrew song genres).
 */
export function isReligiousPlaylistSlug(slug?: string | null): boolean {
  if (!slug) return false
  if (curatedPlaylistSectionBySlug[slug] === 'jewish') return true
  const hub = getHubZoneForSlug(slug)
  return hub === 'songbook' || hub === 'israeli'
}

export function resolveCuratedSlugFromCoverUrl(imageUrl: string): string | null {
  for (const slug of Object.keys(CURATED_PLAYLIST_COVER_FILES)) {
    const url = getCuratedPlaylistCoverUrl(slug)
    if (url && imageUrl === url) return slug
  }
  return null
}

export interface PlaylistCoverInput {
  name?: string
  imageUrl?: string | null
  curatedSlug?: string | null
}

export interface ResolvePlaylistCoverOptions extends PlaylistCoverInput {
  tsnioutFilterEnabled?: boolean
}

/**
 * Resolves a playlist/folder cover URL, masking secular covers when tsniout is enabled.
 * Matches song cover behavior: unknown / non-jewish → no cover (placeholder).
 *
 * Religious allowlist (filter on):
 * - explicit `curatedSlug` in jewish / songbook / israeli
 * - cover asset itself is a jewish curated file (e.g. folder cover picker)
 * - name-only curated match when there is no custom `imageUrl`
 */
export function resolvePlaylistCoverUrl({
  name = '',
  imageUrl,
  curatedSlug,
  tsnioutFilterEnabled = false,
}: ResolvePlaylistCoverOptions): string | null {
  const rawUrl = getPlaylistDisplayCoverUrl({
    name,
    imageUrl: imageUrl ?? undefined,
    curatedSlug,
  })

  if (!tsnioutFilterEnabled) {
    return rawUrl
  }

  if (isReligiousPlaylistSlug(curatedSlug)) {
    return rawUrl
  }

  if (imageUrl) {
    const fromUrl = resolveCuratedSlugFromCoverUrl(imageUrl)
    if (isReligiousPlaylistSlug(fromUrl)) {
      return rawUrl
    }
    // Custom / secular picker cover on user folders → mask
    return null
  }

  // No imageUrl: allow auto-resolved curated covers only when the name maps to jewish
  const fromName = resolveCoverSlugFromName(name)
  if (isReligiousPlaylistSlug(fromName)) {
    return rawUrl
  }

  return null
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
