import { CURATED_PLAYLISTS } from '@/data/curatedPlaylists'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'

/** Prefer these as full-width featured cards when present in the zone. */
export const HUB_FEATURED_SLUG_PRIORITY = [
  'spotify-top-israel',
  'spotify-top-global',
  'spotify-top-france',
  // hassidic stays with carlebach as half/half artist banners (not featured)
  'ishay-ribo',
  'variete-francaise',
  'rap-fr',
  'acoustic',
] as const

/**
 * Songbook artist banners that must share one mobile row (≈50/50), never stack
 * in a 2-row scroll grid column or as separate full-width featured cards.
 */
export const HUB_ARTIST_BANNER_PAIR_SLUGS = ['hassidic', 'carlebach'] as const

/** Enough for a 2-row horizontal strip that scrolls past the first viewport. */
export const LIST_SLOTS = 12
/** Israeli hub uses a taller 3-row strip — budget more list slots. */
export const ISRAELI_LIST_SLOTS = 18

export type HubPlaylistPartition = {
  list: PublicPlaylistItem[]
  square: PublicPlaylistItem[]
  featured: PublicPlaylistItem[]
}

export type PartitionHubPlaylistsOptions = {
  /** Override default list budget (before shortcut subtraction). */
  listSlots?: number
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
 * Pull Hassidique | Carlebach out of an artist-banner list so they can render
 * as an explicit side-by-side pair. Only pairs when both slugs are present;
 * otherwise leave them in `rest` for the normal shelf layout.
 */
export function extractArtistBannerPair(
  banners: PublicPlaylistItem[]
): { pair: PublicPlaylistItem[]; rest: PublicPlaylistItem[] } {
  const bySlug = new Map<string, PublicPlaylistItem>()
  for (const item of banners) {
    if (item.curatedSlug) bySlug.set(item.curatedSlug, item)
  }

  const pair: PublicPlaylistItem[] = []
  for (const slug of HUB_ARTIST_BANNER_PAIR_SLUGS) {
    const item = bySlug.get(slug)
    if (item) pair.push(item)
  }

  if (pair.length !== HUB_ARTIST_BANNER_PAIR_SLUGS.length) {
    return { pair: [], rest: banners }
  }

  const pairIds = new Set(pair.map((p) => p.id))
  return {
    pair,
    rest: banners.filter((p) => !pairIds.has(p.id)),
  }
}

/**
 * Split zone playlists into Spotify-home layouts:
 * list (first slots) → square shelf → featured full-width (preferred slugs / last).
 * `shortcutCount` reduces list playlist slots (liked/recent take space).
 */
export function partitionHubPlaylists(
  playlists: PublicPlaylistItem[],
  shortcutCount = 0,
  options: PartitionHubPlaylistsOptions = {}
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

  const baseSlots = options.listSlots ?? LIST_SLOTS
  const listBudget = Math.max(0, baseSlots - Math.max(0, shortcutCount))
  const list = pool.splice(0, listBudget)
  const square = pool

  return { list, square, featured }
}
