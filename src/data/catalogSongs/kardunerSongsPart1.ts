import type { NewSongData } from '@/types'
import {
  KARDUNER_AUTHOR,
  KARDUNER_DECADE,
  KARDUNER_GENRE,
} from '@/data/catalogSongs/kardunerShared'

type KardunerSong = NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
}

function kardunerSong(
  slug: string,
  title: string,
  key: string,
  content: string,
  opts?: { capo?: number; versionDescription?: string; difficulty?: string }
): KardunerSong {
  return {
    slug,
    title,
    author: KARDUNER_AUTHOR,
    key,
    capo: opts?.capo,
    genre: KARDUNER_GENRE,
    difficulty: opts?.difficulty ?? 'Intermediate',
    decade: KARDUNER_DECADE,
    versionDescription: opts?.versionDescription,
    sourceSite: 'Curated',
    tabId: `curated:${slug}`,
    content,
  }
}

export const KARDUNER_SONGS_PART1: KardunerSong[] = [
  kardunerSong(
    'az',
    'Da (דע)',
    'C',
    `[דע]
C
דע,

2x [
        Am                 G
כי צריך לדון את כל אדם לכף זכות,

          F        G
ואפילו מי שהוא רשע גמור,

     Em                      C
צריך לחפש ולמצוא בו איזה מעט טוב,

       F         G
שבאותו המעט אינו רשע,

    Em                  C
ועל ידי זה שמוצא בו מעט טוב,

    Em       Am
ודן אותו לכף זכות,

   Em               Am
על ידי זה מעלה אותו באמת לכף זכות,

      F      G
ויוכל להשיבו בתשובה.
`,
    { versionDescription: 'Likutey Moharan 282 · C · Am · F · G · Em' }
  ),

  kardunerSong(
    'hashem-melech',
    'Hashem Melech (ה\' מלך)',
    'Em',
    `[ה' מלך]
2x [
   Em
ה' מלך

   C
ה' מלך

   Am         Em
ה' ימלך לעולם ועד:

2x [
Am      Em
והיה ה' למלך

Am    Em
על כל הארץ
]

     C
ביום ההוא

        G        D
יהיה ה' אחד ושמו אחד:
`,
    { versionDescription: 'Shacharit prayer · Em · C · Am · G · D' }
  ),

  kardunerSong(
    'hashivenu',
    'Hashivenu (השיבנו)',
    'D',
    `[השיבנו]
Em           D6
השיבנו אבינו לתורתך

Em           D6
וקרבנו מלכנו לעבודתך,

2x [
AmEm/B   C      C    G   D7
והחזירנו בתשובה שלמה לפניך,

Em                Am
ברוך אתה ד', הרוצה בתשובה:
`,
    { versionDescription: 'Amidah prayer · D6 · Em · Em/B · C · G · D7 · Am' }
  ),

  kardunerSong(
    'mekimi',
    'Mekimi (מקימי)',
    'Em',
    `[מקימי]
Am     Em
מי כד' אלוקינו

F       Am
המגביהי לשבת:

G      CG
המשפילי לראות,

F     Am  G
בשמים ובארץ

F     G    C  G/B Am
מקימי מעפר דל,

F      G    C
מאשפות ירים אביון:

F       G  C G/B  Am
להושיבי עם נ די בים,

F  G     C
עם נדיבי עמו:
`,
    { versionDescription: 'Psalms 113 · Em · Am · F · G · C · G/B' }
  ),

  kardunerSong(
    'tismach',
    'Tismach (תשמח)',
    'G',
    `[בית א']
Fmaj7   G6  Em7  Am  G6
תשמח, אל תראה רק את הרע,

Fmaj7   G6  Em7  Am  G6
תשמח, תראה את הטוב כי גם ברע יש דבר נסתר,

Fmaj7   G6  Em7  Am  G6
חפש ומצא את הטוב.

Fmaj7   G6  Em7  Am  G6
תשמח, אל תראה רק את הרע,

Fmaj7   G6  Em7  Am  G6
תשמח, תראה את הטוב.

Fmaj7   G6  Em7  Am  G6 Fmaj7 G6 Am G
בכל אדם יש דבר נסתר, חפש ומצא את הטוב.

[פזמון]
2x [
Am   Dm    G      C
תשמח, יש תקוה ידידי. תראה סימנים בדרך

Am   Dm    G      C
תשמח, כי לכל יהודי יש חלק לעולם הבא.

[בית ב']
Fmaj7   G6  Em7  Am  G6
תשמח, אל תראה רק את הרע.

Fmaj7   G6  Em7  Am  G6 Fmaj7 G6 Am G
תשמח, תראה את הטוב וגם בך יש דבר נסתר,

Fmaj7 G6 Am G
חפש ומצא את הטוב.

...תשמח
`,
    { versionDescription: 'G6 · Am · Em7 · Fmaj7 · C · G · Dm' }
  ),

  kardunerSong(
    'tachnun',
    'Tachnun (תחנון)',
    'Em',
    `[תחנון]
Em      D6      Cmaj7     D6
אנא ד' אלקינו ואלקי אבותינו,
Em      D6      Cmaj7     D6
תבא לפניך תפלתנו,
Em      D6      Cmaj7     D6
ואל תתעלם מתחנתנו 2x
Em      D6      Cmaj7     D6
אוי איי.... 2x
`,
    { versionDescription: 'Shacharit & Mincha · Em · D6 · Cmaj7' }
  ),

  kardunerSong(
    'kshe-adam-yodea',
    'Kshe\'adam Yodea (כשאדם יודע)',
    'F',
    `[כשאדם יודע]
2x [
F       C       G
כשאדם יודע שכל מאורעותיו הם לטובתו,
Dm      G       Am
זאת הבחינה היא מעין עולם הבא
]
F  C  G  Dm  G  Am
ניי... 2x
`,
    { versionDescription: 'Likutey Moharan 4 · F · C · G · Dm · Am' }
  ),

  kardunerSong(
    'vtaher-libenu',
    'V\'taher Libenu (וטהר לבנו)',
    'C',
    `[וטהר לבנו]
C       F       C       F
וטהר לבנו לעבדך באמת,
C       F       Em      Am      C       F
והנחילנו ד' אלקינו באהבה וברצון
C       F       C       F
שבת קדשך, וינוחו בם כל ישראל
C       G       F
מקדשי שמך.
`,
    { versionDescription: 'Shabbat Mincha · C · F · Em · Am · G' }
  ),

  kardunerSong(
    'kol-haolam',
    'Kol Ha\'olam (כל העולם)',
    'F#m',
    `[כל העולם]
2x [
B7      Em
כי, צריך כל אדם לומר:
C       Am      B7      Em
כל העולם לא נברא אלא בשבילי (סנהדרין ל"ז)
Bm      Am      Em
נמצא כשהעולם נברא בשבילי,
D/F#    G       Am      Em
צריך אני לראות ולעין בכל עת בתקון העולם.
Bb°     Am      B7      Em
ולמלאות חסרון העולם ולהתפלל בעבורם
]`,
    { capo: 2, versionDescription: 'Likutey Moharan 5 · Capo 2 · F#m · Em · Am · B7' }
  ),

  kardunerSong(
    'ish-hayisraeli',
    'Ish HaYisraeli (איש הישראלי)',
    'A',
    `[איש הישראלי]
C       G       C       G
כי איש הישראלי צריך תמיד להסתכל בהשכל,
C       G       C       G
ולקשר עצמו אל החכמה והשכל
C       D       C       G
שיש בכל דבר כדי שיאיר לו השכל,
C       G       C       D
שיש בכל דבר להתקרב להשם יתברך
B7      Em      C       G
על ידי אותו הדבר, כי השכל הוא אור גדול
Em      Am      F
ומאיר לו בכל דרכיו, כמו שכתוב
C       B7
"חכמת אדם תאיר פניו" (קהלת ח')
`,
    { capo: 2, versionDescription: 'Likutey Moharan I · Capo 2 · A · C · G · Em' }
  ),
]
