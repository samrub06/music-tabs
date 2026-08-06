/**
 * Popularity-first catalog sources.
 *
 * "Spotify" here means researching what people stream (public chart pages + AI),
 * NOT the Spotify Web API.
 */
export type SpotifyPopularMarketHint = 'IL' | 'INTL'

export type PopularResearchMode = 'chart' | 'ai'

export type SpotifyPopularSource = {
  /** Stable key for --source= CLI filter */
  key: string
  name: string
  marketHint?: SpotifyPopularMarketHint
  /** Curated playlist slug to update with scraped song_ids */
  targetSlug: string
  /** Catalog genre tag written on upserted songs */
  catalogGenre: string
  description?: string
  /**
   * chart = fetch public Spotify daily chart mirror (kworb)
   * ai = ask OpenAI to research popular tracks for this shelf
   */
  researchMode: PopularResearchMode
  /** Public chart URL when researchMode === 'chart' */
  chartUrl?: string
  /** Research brief when researchMode === 'ai' */
  aiPrompt?: string
}

/**
 * Top charts (web mirror of Spotify daily) + AI-researched Jewish/Israeli shelves.
 */
export const SPOTIFY_POPULAR_SOURCES: SpotifyPopularSource[] = [
  {
    key: 'top-israel',
    name: 'Top 50 — Israel',
    marketHint: 'IL',
    targetSlug: 'spotify-top-israel',
    catalogGenre: 'spotify-top-israel',
    description: 'Spotify daily Israel (public chart) → Tab4U/Negina',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/il_daily.html',
  },
  {
    key: 'top-global',
    name: 'Top 50 — Global',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-global',
    catalogGenre: 'spotify-top-global',
    description: 'Spotify daily Global (public chart) → Ultimate Guitar',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/global_daily.html',
  },
  {
    key: 'editorial-hassidic',
    name: 'Hassidic hits (popular)',
    marketHint: 'IL',
    targetSlug: 'hassidic',
    catalogGenre: 'hebrew-hassidic',
    description: 'AI research of popular Hassidic / חסידי hits → hassidic shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular Hassidic / חסידי Jewish songs that people stream a lot (Shwekey, Fried, Motty Steinmetz, Beri Weber, Miami Boys Choir, Zanvil Weinberger, Breslov nigunim, etc.). Prefer well-known hits with chords/tabs. Titles and artists in Hebrew when that is how they are known.',
  },
  {
    key: 'editorial-ribo',
    name: 'Ishay Ribo (popular)',
    marketHint: 'IL',
    targetSlug: 'ishay-ribo',
    catalogGenre: 'hebrew-ribo',
    description: 'AI research of popular Ishay Ribo tracks → ishay-ribo shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Ishay Ribo (ישי ריבו) songs — his biggest hits and currently well-known tracks. Artist must be Ishay Ribo / ישי ריבו. Prefer Hebrew titles as commonly written.',
  },
]

export function getSpotifyPopularSource(
  key: string
): SpotifyPopularSource | undefined {
  return SPOTIFY_POPULAR_SOURCES.find((s) => s.key === key)
}

export function listConfiguredSpotifyPopularSources(): SpotifyPopularSource[] {
  return SPOTIFY_POPULAR_SOURCES.filter((s) => {
    if (s.researchMode === 'chart') return Boolean(s.chartUrl?.trim())
    return Boolean(s.aiPrompt?.trim())
  })
}
