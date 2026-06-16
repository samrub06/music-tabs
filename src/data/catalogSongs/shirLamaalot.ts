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
 * Chord positions aligned to Hebrew lyrics (RTL) per the printed partition.
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
F           Em  Am
שיר למעלות, אשא עיני

Am        Dm6  Am
אל ההרים, מאין יבוא עזרי:

Am   F            Em   Am
עזרי מעם ד', עושה שמים וארץ:

       Am   G      Dm Am    Dm6
אל יתן למוט רגלך, אל ינום שמרך:

Am  Dm      G       C     G
הנה לא ינום ולא ישן שומר ישראל:

Am G      Dm Am        Dm6
ד' שמרך, ד' צלך על יד ימינך:

Am   Dm    G        C    G
יומם השמש לא יככה וירח בלילה:

Am G      Dm       Am        Dm6
ד' ישמרך מכל רע, ישמר את נפשך:

Am G    Dm            Am        Dm6
ד' ישמר צאתך ובואך, מעתה ועד עולם:
`,
}
