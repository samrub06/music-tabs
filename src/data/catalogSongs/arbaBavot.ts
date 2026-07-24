import type { NewSongData } from '@/types'
import { HEBREW_CATALOG_GENRES } from '@/data/hebrewCatalogGenres'

export const ARBA_BAVOT_CATALOG_SONG_SLUG = 'arba-bavot'

/**
 * Curated: ניגון ארבע בבות — the "Niggun of Four Stanzas" composed by the
 * Alter Rebbe (אדמו״ר הזקן), the most sacred Chabad niggun.
 * Chords transcribed from the Chilik Frank chord sheet (section א only).
 * Mode: A freygish (Ahava Rabba) — A · Dm · Gm · Bb.
 */
export const ARBA_BAVOT_CATALOG_SONG: NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
} = {
  slug: ARBA_BAVOT_CATALOG_SONG_SLUG,
  title: 'Arba Bavot (ניגון ארבע בבות)',
  author: 'Alter Rebbe (אדמו״ר הזקן)',
  key: 'A',
  genre: HEBREW_CATALOG_GENRES.chabad,
  difficulty: 'Intermediate',
  decade: 2020,
  songImageUrl:
    'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b6/57/74/b6577455-e038-5902-52fe-f0413ca5d8c5/7294276307861.png/600x600bb.jpg',
  /** Chilik Frank chord sheet (section א) — uploaded to catalog-images/sheets/. */
  sheetImageUrl:
    'https://ulagoqlmeckwaxabvdof.supabase.co/storage/v1/object/public/catalog-images/sheets/arba-bavot.jpg',
  versionDescription: 'ניגון חב״ד · לחן אדמו״ר הזקן · עיבוד חיליק פרנק · A · Dm · Gm · Bb',
  sourceSite: 'Curated',
  tabId: `curated:${ARBA_BAVOT_CATALOG_SONG_SLUG}`,
  content: `[א]
| A | Dm | A | Dm |
| A  Bb | A |

| A | Dm | Gm |
| A  Bb | A |
`,
}
