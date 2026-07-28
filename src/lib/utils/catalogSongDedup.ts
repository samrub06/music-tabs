import { normalizeCatalogSourceUrl } from '@/lib/utils/catalogSourceIdentity'

export type CatalogSongRef = {
  id: string
  user_id?: string | null
  tab_id?: string | null
  source_url?: string | null
  title: string
  author: string
  view_count?: number | null
  created_at?: string
}

export function catalogSongKey(title: string, author: string): string {
  const norm = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')
  return `${norm(title)}|${norm(author)}`
}

/** Legacy key: url if present, else title|author (can cross-source — avoid for merges). */
export function catalogDedupKey(song: Pick<CatalogSongRef, 'title' | 'author' | 'source_url'>): string {
  const url = song.source_url?.trim().toLowerCase()
  return url || catalogSongKey(song.title, song.author)
}

/**
 * Strict dedup key for catalog merges: source_url or tab_id only.
 * Returns null when neither is present (do not merge on title alone).
 */
export function catalogSourceIdentityDedupKey(
  song: Pick<CatalogSongRef, 'tab_id' | 'source_url'>
): string | null {
  const rawUrl = song.source_url?.trim()
  if (rawUrl) {
    try {
      return `url:${normalizeCatalogSourceUrl(rawUrl)}`
    } catch {
      return `url:${rawUrl.toLowerCase()}`
    }
  }
  const tabId = song.tab_id?.trim()
  if (tabId) {
    if (/^\d{5,}$/.test(tabId)) return `tab:${tabId}`
    if (tabId.startsWith('ug:')) return `tab:${tabId.slice(3)}`
    return `tab:${tabId}`
  }
  return null
}

/** Pick the best row to represent a song in the public catalog. */
export function pickCanonicalCatalogSong<T extends CatalogSongRef>(songs: T[]): T {
  return [...songs].sort((a, b) => {
    const aSystem = a.user_id == null ? 0 : 1
    const bSystem = b.user_id == null ? 0 : 1
    if (aSystem !== bSystem) return aSystem - bSystem

    const aTab = a.tab_id ? 0 : 1
    const bTab = b.tab_id ? 0 : 1
    if (aTab !== bTab) return aTab - bTab

    const aViews = a.view_count ?? 0
    const bViews = b.view_count ?? 0
    if (bViews !== aViews) return bViews - aViews

    return (a.created_at ?? '').localeCompare(b.created_at ?? '')
  })[0]
}

export function dedupeCatalogSongs<T extends CatalogSongRef>(songs: T[]): T[] {
  const groups = new Map<string, T[]>()

  for (const song of songs) {
    const key = catalogDedupKey(song)
    const group = groups.get(key) ?? []
    group.push(song)
    groups.set(key, group)
  }

  return Array.from(groups.values()).map((group) => pickCanonicalCatalogSong(group))
}

/** Group catalog songs by strict source identity only (no title-only groups). */
export function groupCatalogSongsBySourceIdentity<T extends CatalogSongRef>(
  songs: T[]
): T[][] {
  const groups = new Map<string, T[]>()
  for (const song of songs) {
    const key = catalogSourceIdentityDedupKey(song)
    if (!key) continue
    const group = groups.get(key) ?? []
    group.push(song)
    groups.set(key, group)
  }
  return Array.from(groups.values())
}
