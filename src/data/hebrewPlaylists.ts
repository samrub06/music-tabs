/** Catalog genre tags used when importing Tab4U songs into the public library. */
export const HEBREW_CATALOG_GENRES = {
  chabad: 'hebrew-chabad',
  hassidic: 'hebrew-hassidic',
} as const

export type HebrewCatalogGenre =
  (typeof HEBREW_CATALOG_GENRES)[keyof typeof HEBREW_CATALOG_GENRES]

export interface HebrewPlaylistSongEntry {
  /** Hebrew search query sent to Tab4U */
  searchQuery?: string
  /** Optional: pick a result whose title contains this substring */
  titleIncludes?: string
  /** Optional: pick a result whose author contains this substring */
  authorIncludes?: string
  /** Link a song already in the public catalog (see FEATURED_CATALOG_SONG_SLUG). */
  catalogTabId?: string
}

export interface HebrewPlaylistDefinition {
  slug: string
  name: string
  description: string
  catalogGenre: HebrewCatalogGenre
  displayOrder: number
  gradientFrom: string
  gradientTo: string
  songs: HebrewPlaylistSongEntry[]
}

export const HEBREW_PLAYLISTS: HebrewPlaylistDefinition[] = [
  {
    slug: 'chabad-nigunim',
    name: 'Nigounim Habad',
    description: 'ניגוני חב״ד — prières et mélodies de la tradition Habad',
    catalogGenre: HEBREW_CATALOG_GENRES.chabad,
    displayOrder: 1,
    gradientFrom: 'from-blue-700',
    gradientTo: 'to-indigo-900',
    songs: [
      { searchQuery: 'אנא בכח', titleIncludes: 'אנא בכח' },
      { searchQuery: 'ויהי נועם', titleIncludes: 'ויהי נועם', authorIncludes: 'שטיינמץ' },
      { searchQuery: 'יחי אדונינו', authorIncludes: 'חב' },
      { searchQuery: 'אבינו מלכנו', authorIncludes: 'חב' },
      { searchQuery: 'ניגון הנשמות', authorIncludes: 'חנן' },
      { searchQuery: 'הושיעה', authorIncludes: 'שלומי שבת' },
      { searchQuery: 'יהי רצון', authorIncludes: 'ישי ריבו' },
      { catalogTabId: 'curated:ki-leckha-nae' },
      { searchQuery: 'הללויה', authorIncludes: 'משה פרץ' },
      { searchQuery: 'ניגון', titleIncludes: 'ניגון' },
    ],
  },
  {
    slug: 'hassidic',
    name: 'Hassidique',
    description: 'חסידי — nigounim et chants de la tradition hassidique',
    catalogGenre: HEBREW_CATALOG_GENRES.hassidic,
    displayOrder: 2,
    gradientFrom: 'from-amber-700',
    gradientTo: 'to-orange-900',
    songs: [
      { searchQuery: 'עוד חוזר הניגון', titleIncludes: 'עוד חוזר הניגון' },
      { searchQuery: 'ניגון ברדיצב', titleIncludes: 'ברדיצ' },
      { searchQuery: 'אם אשכחך', authorIncludes: 'קרליבך' },
      { searchQuery: 'ממעמקים', authorIncludes: 'רייכל' },
      { searchQuery: 'ניגונים', authorIncludes: 'אביאל סולטן' },
      { searchQuery: 'מחרוזת ניגונים', titleIncludes: 'מחרוזת' },
      { searchQuery: 'עולם הבא', authorIncludes: 'מודז' },
      { searchQuery: 'הללויה', authorIncludes: 'משה פרץ' },
      { searchQuery: 'יהי רצון', authorIncludes: 'רוחמה' },
    ],
  },
]
