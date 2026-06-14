import type { NewSongData } from '@/types'
import {
  KARDUNER_AUTHOR,
  KARDUNER_DECADE,
  KARDUNER_GENRE,
} from '@/data/catalogSongs/kardunerShared'

export const SHIR_LAMAALOT_CATALOG_SONG_SLUG = 'shir-lamaalot'

/**
 * Curated arrangement from the user's chord sheet (Psalms 121).
 * Music: Yosef Karduner · Key Am
 */
export const SHIR_LAMAALOT_CATALOG_SONG: NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
} = {
  slug: SHIR_LAMAALOT_CATALOG_SONG_SLUG,
  title: 'Shir LaMa\'alot (שיר למעלות)',
  author: KARDUNER_AUTHOR,
  key: 'Am',
  genre: KARDUNER_GENRE,
  difficulty: 'Intermediate',
  decade: KARDUNER_DECADE,
  versionDescription: 'Psalms 121 · Yosef Karduner · Am · Em · F · Dm · G · C',
  sourceSite: 'Curated',
  tabId: `curated:${SHIR_LAMAALOT_CATALOG_SONG_SLUG}`,
  content: `[שיר למעלות]
Am              Em        F
שיר למעלות, אשא עיני

Am                    Dm6        Am
אל ההרים, מאין יבוא עזרי:

Am         Em    F              Am
עזרי מעם ד', עושה שמים וארץ:

Dm6    Am              Dm    G         Am
אל יתן למוט רגלך, אל ינום שמרך:

G         C         G         Dm        Am
הנה לא ינום ולא ישן שומר ישראל:

Dm6    Am         Dm    G           Am
ד' שמרך, ד' צלך על יד ימינך:

G         C              G         Dm        Am
יומם השמש לא יככה וירח בלילה:

Dm6    Am         Dm    G         Am
ד' ישמרך מכל רע, ישמר את נפשך:

Dm6    Am              Dm         G         Am
ד' ישמר צאתך ובואך, מעתה ועד עולם:
`,
}
