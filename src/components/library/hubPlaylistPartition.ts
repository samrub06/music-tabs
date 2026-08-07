import { CURATED_PLAYLISTS } from '@/data/curatedPlaylists'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'

/** Prefer these as full-width featured cards when present in the zone. */
export const HUB_FEATURED_SLUG_PRIORITY = [
  'spotify-top-israel',
  'spotify-top-global',
  'spotify-top-france',
  'hassidic',
  'ishay-ribo',
  'variete-francaise',
  'rap-fr',
  'acoustic',
] as const

/** Enough for a 2-row horizontal strip that scrolls past the first viewport. */
const LIST_SLOTS = 12

export type HubPlaylistPartition = {
  list: PublicPlaylistItem[]
  square: PublicPlaylistItem[]
  featured: PublicPlaylistItem[]
}

export function sortPlaylistsByDisplayOrder(
  playlists: PublicPlaylistItem[]
): PublicPlaylistItem[] {
  return [...playlists].sort((a, b) => {
    const orderA = CURATED_PLAYLISTS.find((p) => p.slug === a.curatedSlug)?.displayOrder ?? 0
    const orderB = CURATED_PLAYLISTS.find((p) => p.slug === b.curatedSlug)?.displayOrder ?? 0
    return orderA - orderB
  })
}

/**
 * Split zone playlists into Spotify-home layouts:
 * list (first slots) → square shelf → featured full-width (preferred slugs / last).
 * `shortcutCount` reduces list playlist slots (liked/recent take space).
 */
export function partitionHubPlaylists(
  playlists: PublicPlaylistItem[],
  shortcutCount = 0
): HubPlaylistPartition {
  const pool = sortPlaylistsByDisplayOrder(playlists)
  const featured: PublicPlaylistItem[] = []

  for (const slug of HUB_FEATURED_SLUG_PRIORITY) {
    if (featured.length >= 2) break
    const idx = pool.findIndex((p) => p.curatedSlug === slug)
    if (idx >= 0) {
      featured.push(pool.splice(idx, 1)[0]!)
    }
  }

  if (featured.length === 0 && pool.length > 0) {
    const n = pool.length >= 8 ? 2 : 1
    featured.push(...pool.splice(Math.max(0, pool.length - n), n))
  } else if (featured.length === 1 && pool.length >= 8) {
    featured.push(pool.pop()!)
  }

  const listBudget = Math.max(0, LIST_SLOTS - Math.max(0, shortcutCount))
  const list = pool.splice(0, listBudget)
  const square = pool

  return { list, square, featured }
}
