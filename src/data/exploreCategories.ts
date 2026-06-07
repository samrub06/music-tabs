/** Ultimate Guitar Explore filters — shared by scraper, /explore page, curated playlists. */

export const EXPLORE_GENRES = [
  { id: '4', name: 'Rock' },
  { id: '14', name: 'Pop' },
  { id: '666', name: 'Folk' },
  { id: '45', name: 'World Music' },
  { id: '1781', name: 'Reggae' },
] as const

export const EXPLORE_DIFFICULTIES = [
  { id: '1', name: 'Absolute Beginner' },
  { id: '2', name: 'Beginner' },
] as const

export const EXPLORE_DECADES = [
  { year: 1990, name: '1990s' },
  { year: 2000, name: '2000s' },
  { year: 2010, name: '2010s' },
  { year: 2020, name: '2020s' },
] as const

export interface UltimateGuitarExploreFilter {
  genre?: string
  difficulty?: string
  decade?: number
}

const EXPLORE_BASE = 'https://www.ultimate-guitar.com/explore'

/**
 * Builds an Ultimate Guitar explore URL.
 * Decade-only: https://www.ultimate-guitar.com/explore?decade[]=2020
 */
export function buildUltimateGuitarExploreUrl(filter?: UltimateGuitarExploreFilter): string {
  if (!filter?.genre && !filter?.difficulty && filter?.decade == null) {
    return `${EXPLORE_BASE}?order=hitstotal_desc&type[]=Tabs`
  }

  const params = new URLSearchParams()

  if (filter.decade != null) {
    params.append('decade[]', String(filter.decade))
  }
  if (filter.genre) {
    params.append('genres[]', filter.genre)
  }
  if (filter.difficulty) {
    params.append('difficulty[]', filter.difficulty)
  }

  return `${EXPLORE_BASE}?${params.toString()}`
}
