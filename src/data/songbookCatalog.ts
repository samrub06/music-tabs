/** Public catalog genre for the Jewish songbook (Tab4U + future sources). */
export const SONGBOOK_CATALOG_GENRE = 'hebrew-songbook'

export const SONGBOOK_PLAYLIST = {
  slug: 'jewish-songbook',
  name: 'Songbook',
  description: '',
  displayOrder: 9,
  gradientFrom: 'from-teal-700',
  gradientTo: 'to-cyan-900',
} as const

export interface SongbookEntry {
  transliteration: string
  hebrew: string
  artist?: string
  artistHebrew?: string
}

export interface SongbookFile {
  sections: Array<{
    id: string
    name: string
    songs: SongbookEntry[]
  }>
}
