export type CuratedPlaylistFilter =
  | { type: 'genre'; value: string }
  | { type: 'decade'; value: number }
  | { type: 'difficulty'; value: string }
  | { type: 'difficultyIn'; values: string[] }

export type CuratedPlaylistSection = 'genre' | 'decade' | 'difficulty'

export interface CuratedPlaylistDefinition {
  slug: string
  name: string
  description: string
  section: CuratedPlaylistSection
  displayOrder: number
  filter: CuratedPlaylistFilter
  /** Tailwind gradient stops for card when no cover image */
  gradientFrom: string
  gradientTo: string
}

export const CURATED_PLAYLIST_SECTION_ORDER: CuratedPlaylistSection[] = [
  'genre',
  'decade',
  'difficulty',
]

/** Prefilled public playlists shown on the explorer (/search) page. */
export const CURATED_PLAYLISTS: CuratedPlaylistDefinition[] = [
  {
    slug: 'rock',
    name: 'Rock',
    description: 'Classic and modern rock tabs',
    section: 'genre',
    displayOrder: 1,
    filter: { type: 'genre', value: '4' },
    gradientFrom: 'from-red-600',
    gradientTo: 'to-orange-700',
  },
  {
    slug: 'pop',
    name: 'Pop',
    description: 'Popular hits and chart toppers',
    section: 'genre',
    displayOrder: 2,
    filter: { type: 'genre', value: '14' },
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-purple-600',
  },
  {
    slug: 'folk',
    name: 'Folk',
    description: 'Acoustic folk and singer-songwriter',
    section: 'genre',
    displayOrder: 3,
    filter: { type: 'genre', value: '666' },
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-yellow-700',
  },
  {
    slug: 'reggae',
    name: 'Reggae',
    description: 'Reggae and island grooves',
    section: 'genre',
    displayOrder: 4,
    filter: { type: 'genre', value: '1781' },
    gradientFrom: 'from-green-600',
    gradientTo: 'to-emerald-800',
  },
  {
    slug: '90s',
    name: '90s',
    description: 'Hits from the 1990s',
    section: 'decade',
    displayOrder: 1,
    filter: { type: 'decade', value: 1990 },
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-violet-700',
  },
  {
    slug: '2000s',
    name: '2000s',
    description: 'Hits from the 2000s',
    section: 'decade',
    displayOrder: 2,
    filter: { type: 'decade', value: 2000 },
    gradientFrom: 'from-sky-600',
    gradientTo: 'to-blue-800',
  },
  {
    slug: '2010s',
    name: '2010s',
    description: 'Hits from the 2010s',
    section: 'decade',
    displayOrder: 3,
    filter: { type: 'decade', value: 2010 },
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-teal-800',
  },
  {
    slug: '2020s',
    name: '2020s',
    description: 'Recent favorites',
    section: 'decade',
    displayOrder: 4,
    filter: { type: 'decade', value: 2020 },
    gradientFrom: 'from-fuchsia-600',
    gradientTo: 'to-pink-700',
  },
  {
    slug: 'beginner',
    name: 'Beginner',
    description: 'Easy songs to get started',
    section: 'difficulty',
    displayOrder: 1,
    filter: {
      type: 'difficultyIn',
      values: ['1', '2', 'novice', 'beginner', 'absolute beginner'],
    },
    gradientFrom: 'from-lime-600',
    gradientTo: 'to-green-700',
  },
  {
    slug: 'intermediate',
    name: 'Intermediate',
    description: 'Songs for growing guitarists',
    section: 'difficulty',
    displayOrder: 2,
    filter: {
      type: 'difficultyIn',
      values: ['3', 'intermediate', 'easy intermediate'],
    },
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
  },
  {
    slug: 'expert',
    name: 'Expert',
    description: 'Challenging tabs for advanced players',
    section: 'difficulty',
    displayOrder: 3,
    filter: {
      type: 'difficultyIn',
      values: ['4', '5', 'advanced', 'expert', 'hard', 'virtuoso'],
    },
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-red-800',
  },
]

export const CURATED_PLAYLIST_SONG_LIMIT = 20

export const curatedPlaylistSectionBySlug = Object.fromEntries(
  CURATED_PLAYLISTS.map((playlist) => [playlist.slug, playlist.section])
) as Record<string, CuratedPlaylistSection>
