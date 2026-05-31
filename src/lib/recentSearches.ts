export const RECENT_SEARCHES_KEY = 'recentSearches'
export const MAX_RECENT_SEARCHES = 30
export const RECENT_SEARCHES_PREVIEW = 3
export const FALLBACK_SEARCH_IMAGE_URL =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'

export interface RecentSearchItem {
  query: string
  title?: string
  author?: string
  songImageUrl?: string
  artistImageUrl?: string
  url?: string
}

export interface RecentSearchPreview {
  title: string
  author?: string
  songImageUrl?: string
  artistImageUrl?: string
  url?: string
}

export function parseRecentSearches(stored: string): RecentSearchItem[] {
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item): RecentSearchItem | null => {
        if (typeof item === 'string' && item.trim()) {
          return { query: item.trim() }
        }
        if (item && typeof item === 'object' && typeof item.query === 'string' && item.query.trim()) {
          return {
            query: item.query.trim(),
            title: typeof item.title === 'string' ? item.title : undefined,
            author: typeof item.author === 'string' ? item.author : undefined,
            songImageUrl: typeof item.songImageUrl === 'string' ? item.songImageUrl : undefined,
            artistImageUrl: typeof item.artistImageUrl === 'string' ? item.artistImageUrl : undefined,
            url: typeof item.url === 'string' ? item.url : undefined,
          }
        }
        return null
      })
      .filter((item): item is RecentSearchItem => item !== null)
  } catch {
    return []
  }
}

export function loadRecentSearches(): RecentSearchItem[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
  if (!stored) return []
  return parseRecentSearches(stored)
}

export function saveRecentSearches(items: RecentSearchItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items))
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

export function buildRecentSearchItem(query: string, preview?: RecentSearchPreview): RecentSearchItem {
  if (!preview) return { query }

  return {
    query,
    title: preview.title,
    author: preview.author,
    songImageUrl: preview.songImageUrl,
    artistImageUrl: preview.artistImageUrl,
    url: preview.url,
  }
}

export function upsertRecentSearch(query: string, preview?: RecentSearchPreview): RecentSearchItem[] {
  const trimmed = query.trim()
  if (!trimmed) return loadRecentSearches()

  const entry = buildRecentSearchItem(trimmed, preview)
  const filtered = loadRecentSearches().filter(
    item => item.query.toLowerCase() !== trimmed.toLowerCase()
  )
  const updated = [entry, ...filtered].slice(0, MAX_RECENT_SEARCHES)
  saveRecentSearches(updated)
  return updated
}

export function getRecentSearchDisplay(item: RecentSearchItem) {
  const imageUrl = item.songImageUrl || item.artistImageUrl || FALLBACK_SEARCH_IMAGE_URL
  const title = item.title || item.query
  const subtitle = item.title ? item.author || item.query : item.author

  return { imageUrl, title, subtitle }
}
