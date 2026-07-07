export type LibrarySongRef = {
  id: string
  title: string
  author: string
  genre?: string
  songImageUrl?: string
  artistImageUrl?: string
}

export type SongSuggestion = LibrarySongRef & {
  reason: 'artist' | 'genre'
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/** All library songs by the same artist, excluding given ids. */
export function getArtistSongsFromLibrary(
  current: { id: string; author: string },
  library: LibrarySongRef[],
  excludeIds: Set<string>
): LibrarySongRef[] {
  const currentAuthor = normalize(current.author)
  if (!currentAuthor) return []

  return library
    .filter(
      (s) =>
        !excludeIds.has(s.id) && normalize(s.author) === currentAuthor
    )
    .sort((a, b) => a.title.localeCompare(b.title))
}

/** Pick one library song with the same genre (artist matches handled separately). */
export function pickAlternativeSong(
  current: { id: string; author: string; genre?: string },
  library: LibrarySongRef[],
  excludeIds: Set<string>
): SongSuggestion | null {
  const candidates = library.filter((s) => !excludeIds.has(s.id))
  if (candidates.length === 0) return null

  const currentGenre = current.genre ? normalize(current.genre) : ''
  if (currentGenre) {
    const byGenre = candidates.find(
      (s) => s.genre && normalize(s.genre) === currentGenre
    )
    if (byGenre) {
      return { ...byGenre, reason: 'genre' }
    }
  }

  return null
}
