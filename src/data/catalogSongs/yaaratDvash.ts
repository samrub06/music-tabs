import type { NewSongData } from '@/types'

export const YAARAT_DVASH_CATALOG_SONG_SLUG = 'yaarat-dvash'

/**
 * Curated arrangement: The Piyut Ensemble (אנסמבל הפיוט)
 * Key F — chords F, Bb, C, C7 (as in the user's chord sheet).
 */
export const YAARAT_DVASH_CATALOG_SONG: NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
} = {
  slug: YAARAT_DVASH_CATALOG_SONG_SLUG,
  title: 'Yaarat Dvash (יערת דבש)',
  author: 'The Piyut Ensemble (אנסמבל הפיוט)',
  key: 'F',
  genre: 'hebrew-moroccan',
  difficulty: 'Intermediate',
  decade: 2010,
  songImageUrl:
    'https://ulagoqlmeckwaxabvdof.supabase.co/storage/v1/object/public/catalog-images/songs/yaarat-dvash.png',
  versionDescription: 'Piyut Ensemble · F · Bb · C · C7',
  sourceSite: 'Curated',
  tabId: `curated:${YAARAT_DVASH_CATALOG_SONG_SLUG}`,
  content: `[Chord chart]
| F | Bb |   | F |
|   |   | Bb | F |
|   |   | C |   |
| F | Bb | F |   |
|   | C | F | Bb |
| F |   |   | C |
| F | Bb | F |   |
|   | C |   | C7 |
| F | Bb | F |   |

[בית א]
F              Bb                    F
יערת דבש על לשונך לבנה כלבנה
Bb             F
ערבו לי שירי הגיונך פצחי לי שיר ורננה
        C
עתה אמיר לך זמנך אחרי בלותך עדנה
F              Bb             F
שושנה אגדיל ששונך שושנה רעננה

[בית ב]
F              Bb                    F
שבעת נוד במדינות ובמדבר מלון אורחים
Bb             F
חוץ למנוחות שאננות ומשכנות מבטחים
        C
את רעיתי בין הבנות כשושנה בין החוחים
F              Bb             F
הכאיבוך הרווך לענות מכל עבר ופנה

[בית ג]
F              Bb                    F
ראה ראיתי דמעתך על פניך נתכה
Bb             F
אעל מזור אל מכתך גם לשברך ארוכה
        C
ויש תקוה לאחריתך ושבו בנים למלוכה
F       C      C7
וצרים שומרים רעתך יהיו משל ושנינה

[בית ד]
F              Bb                    F
אל סף נכסף אל לבבך הוא בנוי לתלפיות
Bb             F
שם אקבצך ואשיבך ממעונות אריות
        C
ושמה אשכן בקרבך כמו שנים קדמוניות
F              Bb             F
עוד לנצח לא אעזבך יונה לחרב יונה

[סיום]
F              Bb             F
שושנה אגדיל ששונך שושנה רעננה
`,
}
