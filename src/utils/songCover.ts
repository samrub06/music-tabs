import { HEBREW_CATALOG_GENRES } from '@/data/hebrewCatalogGenres'
import { SONGBOOK_CATALOG_GENRE } from '@/data/songbookCatalog'

const RELIGIOUS_SONG_GENRES = new Set<string>([
  ...Object.values(HEBREW_CATALOG_GENRES),
  SONGBOOK_CATALOG_GENRE,
])

export function isReligiousSongGenre(genre?: string | null): boolean {
  if (!genre) return false
  if (RELIGIOUS_SONG_GENRES.has(genre)) return true
  return genre.startsWith('hebrew-')
}

export interface SongCoverInput {
  songImageUrl?: string | null
  artistImageUrl?: string | null
  genre?: string | null
}

export interface ResolveSongCoverOptions extends SongCoverInput {
  tsnioutFilterEnabled?: boolean
}

export function resolveSongCoverUrl({
  songImageUrl,
  artistImageUrl,
  genre,
  tsnioutFilterEnabled = false,
}: ResolveSongCoverOptions): string | undefined {
  const rawUrl = songImageUrl || artistImageUrl || undefined

  if (!tsnioutFilterEnabled) {
    return rawUrl
  }

  if (isReligiousSongGenre(genre)) {
    return rawUrl
  }

  return undefined
}
