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

export function catalogDedupKey(song: Pick<CatalogSongRef, 'title' | 'author' | 'source_url'>): string {
  const url = song.source_url?.trim().toLowerCase()
  return url || catalogSongKey(song.title, song.author)
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
