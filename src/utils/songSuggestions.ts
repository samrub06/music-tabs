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

/** Pick one library song: same artist first, else same genre. Excludes given ids. */
export function pickAlternativeSong(
  current: { id: string; author: string; genre?: string },
  library: LibrarySongRef[],
  excludeIds: Set<string>
): SongSuggestion | null {
  const candidates = library.filter((s) => !excludeIds.has(s.id))
  if (candidates.length === 0) return null

  const currentAuthor = normalize(current.author)
  if (currentAuthor) {
    const byArtist = candidates.find((s) => normalize(s.author) === currentAuthor)
    if (byArtist) {
      return { ...byArtist, reason: 'artist' }
    }
  }

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
