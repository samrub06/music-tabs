export type AiSongSuggestion = {
  title: string
  artist: string
  source: 'tab4u' | 'ultimate-guitar'
}

/** Results shown on first load and on each "More" click */
export const AI_SEARCH_PAGE_SIZE = 12

/** Max external tab results kept per AI song suggestion */
export const AI_SEARCH_MAX_RESULTS_PER_SONG = 1

/** @deprecated Use AI_SEARCH_PAGE_SIZE */
export const AI_SEARCH_MAX_TOTAL_RESULTS = AI_SEARCH_PAGE_SIZE

type CollectOptions = {
  excludeUrls?: Set<string>
  maxResults?: number
}

export function collectAiSearchResults<T extends { url: string }>(
  batches: T[][],
  options?: CollectOptions
): T[] {
  const maxResults = options?.maxResults ?? AI_SEARCH_PAGE_SIZE
  const seen = options?.excludeUrls ?? new Set<string>()
  const collected: T[] = []

  for (const batch of batches) {
    if (collected.length >= maxResults) break

    for (const result of batch.slice(0, AI_SEARCH_MAX_RESULTS_PER_SONG)) {
      if (seen.has(result.url)) continue
      seen.add(result.url)
      collected.push(result)
      if (collected.length >= maxResults) break
    }
  }

  return collected
}

export async function fetchAiSongSearchBatches<T extends { url: string }>(
  aiSongs: AiSongSuggestion[]
): Promise<T[][]> {
  const batches: T[][] = []

  for (const aiSong of aiSongs) {
    const searchQuery = `${aiSong.title} ${aiSong.artist}`
    const response = await fetch(
      `/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${aiSong.source}`
    )
    const data = await response.json()

    if (response.ok && Array.isArray(data.results) && data.results.length > 0) {
      batches.push(data.results)
    }
  }

  return batches
}
