/** Ultimate Guitar Explore filters — shared by scraper, /explore page, curated playlists. */

export const EXPLORE_GENRES = [
  { id: '4', name: 'Rock' },
  { id: '14', name: 'Pop' },
  { id: '8', name: 'Metal' },
  { id: '666', name: 'Folk' },
  { id: '49', name: 'Country' },
  { id: '680', name: 'Soundtrack' },
  { id: '1787', name: 'R&B, Funk & Soul' },
  { id: '1016', name: 'Religious Music' },
  { id: '45', name: 'Hip Hop' },
  { id: '16', name: 'Electronic' },
  { id: '195', name: 'World Music' },
  { id: '216', name: 'Classical' },
  { id: '84', name: 'Jazz' },
  { id: '1781', name: 'Reggae & Ska' },
  { id: '99', name: 'Blues' },
  { id: '79', name: 'Comedy' },
  { id: '85', name: 'Disco' },
] as const

export const EXPLORE_DIFFICULTIES = [
  { id: '1', name: 'Absolute Beginner' },
  { id: '2', name: 'Beginner' },
  { id: '3', name: 'Intermediate' },
  { id: '4', name: 'Advanced' },
] as const

export const EXPLORE_DECADES = [
  { year: 1950, name: '1950s' },
  { year: 1960, name: '1960s' },
  { year: 1970, name: '1970s' },
  { year: 1980, name: '1980s' },
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
