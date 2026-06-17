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

export const KARDUNER_SONGS_PART2: KardunerSong[] = [
  kardunerSong(
    'lmaet-bkhavod',
    'L\'ma\'et B\'khavod (למעט בכבוד)',
    'D',
    `[למעט בכבוד]
Am7       D       Dsus4      Am7       D       Dsus4       
כי צריך כל אדם למעט בכבוד עצמו ולהרבות בכבוד המקום
Am7       D       Dsus4       Am7
כי מי שרודף אחר הכבוד, אינו זוכה לכבוד אלקים
D       C       G  Dm
אלא לכבוד של מלכים, שנאמר בו (משלי כ"ה) "כבוד מלכים חקר דבר",
Am       G       Dm  G
והכל חוקרים אחריו ושואלים: מי הוא זה ואיזהו שחולקים לו כבוד הזה
Am  G  Dm       Am7       D       Dsus4       D
וחולקים עליו שאומרים שאינו ראוי לכבוד הזה.
Am7       D       Dsus4       D       Am7       Dsus4       D
אבל מי שבורח מן הכבוד, שממעט בכבוד עצמו ומרבה בכבוד המקום,
Am7       D       Dsus4       Am7
אזי הוא זוכה לכבוד אלקים ואז אין בני אדם חוקרים על כבודו
D
אם הוא ראוי אם לאו, ועליו נאמר: (שם):
C       G       Dm  G       Am
"כבוד אלקים הסתר דבר", כי אסור לחקור על הכבוד הזה.] 3x
Am7       D       Dsus4       Am7
ואי אפשר לזכות לכבוד הזה, אלא ע"י תשובה.
`,
    { versionDescription: 'Likutey Moharan 6 · C · G · Dm · Am7 · D' }
  ),

  kardunerSong(
    'lamnatzeach-bineginot',
    'Lamnatzeach BiNeginot (למנצח בנגינות)',
    'Ab',
    `[למנצח בנגינות]
C  G  C  G
למנצח בנגינות מזמור שיר
Am  Em  Am  Em
אלקים יחננו ויברכנו יאר פניו אתנו סלה
D  C  D
לדעת בארץ דרכך בכל גוים ישועתך
Dsus4
ענו ואמרו:

2x [
C  G  C  G
אם אתה מאמין, שיכולים לקלקל
Em  D  Em
אם אתה מאמין, שיכולים לקלקל
Am  B7  Am  B7
תאמין שיכולים לתקן:
]

2x [
C  G  C  G
אם אתה מאמין, שיכולים לקלקל
Am  B7  Em  Am  B7  Em
תאמין שיכולים לתקן:
]`,
    { capo: 1, versionDescription: 'Psalms 67 · Likutey Moharan 112 · Capo 1 · Am · Em · G · Ab' }
  ),

  kardunerSong(
    'gesher-tzar-meod',
    'Gesher Tzar Me\'od (גשר צר מאוד)',
    'Fm',
    `[גשר צר מאוד]
2x [
Em              Am              Em
ודע שהאדם צריך לעבור
Am      Em      Am      B7      Em
על גשר צר מאוד על גשר צר מאוד
]

2x [
G       C       G       B7      Em      Am      B7      Em
והעיקר שלא יתפחד שלא יתפחד כלל
]`,
    { capo: 1, versionDescription: 'Likutey Moharan II #48 · Capo 1 · B7 · Am · Em · Fm' }
  ),

  kardunerSong(
    'ana-aba',
    'Ana Aba (ה\' אבא)',
    'F#m',
    `[ה' אבא]
Em              Am              Em
ה' אבא, הן אבא הן, אנא כפר על חטאתי
Em              Am              Em
ה' אבא, הן אבא הן, סלח לי על עוונותיי

Am              Em              Am              Em
עוונותיי רבים המה, לילה ויום בוכים
Am              Em              Am              Em
להתקרב אליך הם מחכים, משמים נשמע קולם

Em              Am              Em
ה' אבא, הן אבא הן, אנא האר את דרכי
Em              Am              Em
ה' אבא, הן אבא הן, אנא חסד כל עולמים

Am              Em              Am              Em
ועננו אור אבותינו, בתוך הגולה, במהרה בימינו
Am              Em              Am              Em
ונשמור על האחדות בקרב חברינו

Em              Am              Em
ה' אבא, הן אבא הן, אבא השלם אותי
Am              Em
ענני
Em              Am              Em
ה' אבא, הן אבא הן, אנא שמע את נפשי
`,
    { capo: 2, versionDescription: 'Capo 2 · Am · Em · F#m' }
  ),

  kardunerSong(
    'kol-haneshamah',
    'Kol HaNeshamah (כל הנשמה)',
    'C',
    `[כל הנשמה]
2x [
Am7  D7  G  B7  Em  Em/D  C6
כל הנשמה תהלל יה
B7  Em
ונשמת כל חי
]

2x [
Am7  D7  G  B7  Em  Em/D  C6
הללויה הללויה...
B7  Em
הללויה...
]`,
    { versionDescription: 'Am7 · D7 · G · B7 · Em · C6' }
  ),

  kardunerSong(
    'shir-hamaalot-bm',
    'Shir HaMa\'alot — Bm (שיר המעלות)',
    'Bm',
    `[שיר המעלות]
2x [
F#m  Bm
אשא עיני אל ההרים,
D  G
מאין יבוא עזרי.
A  G
עזרי מעם ה',
A  D
עושה שמים וארץ.
]

A  G
אל יתן למוט רגלך,
A  D
אל ינום שומרך.
A  G
הנה לא ינום ולא יישן,
A  D
שומר ישראל.

2x [
F#m  Bm
ה' ישמרך,
A  D  G
ה' צלך על יד ימינך.
A  D  G  F#m  Bm
נה נה נה נה נה נה נה נה
]`,
    { versionDescription: 'Psalms 121 · A · D · G · F#m · Bm' }
  ),

  kardunerSong(
    'mitzva-gedola',
    'Mitzva Gedola (מצוה גדולה)',
    'E',
    `[מצוה גדולה]
2x [
Am  G  F  E
מצוה גדולה להיות בשמחה תמיד
Am  G
ולהתגבר להרחיק העצבות
F  E
והדאגה בכל לבב,
Am  G
וכל הפלאות הבאות על האדם,
F  E
כולם באים רק מקלקול השמחה
]

...מצוה גדולה
F  C
נננ נננ ננננ
G  Dm
ננננ ננ נננ
F  C
תי נננ נננ
G
תי נננננ...
`,
    { versionDescription: 'Likutey Moharan II #24 · Dm · G · F · Am · E · C' }
  ),

  kardunerSong(
    'shir-lamaalot-bbm',
    'Shir LaMa\'alot — Bbm (שיר למעלות)',
    'Bbm',
    `[שיר למעלות]
Am  Em  F  C
אשא עיני אל ההרים מאין יבוא עזרי
Bø  E7  Am  G6
עזרי מעם ה' עושה שמים וארץ

2x [
F  G  Em
אל יתן למוט רגלך אל ינום שומרך
Am  Am/G  F  G  Am
הנה לא ינום ולא יישן שומר ישראל.
]

2x [
F#m  E  D  A
ה' שומרך ה' צלך על יד ימינך
E  Bm  A
יומם השמש לא יככה וירח בלילה.
]`,
    { capo: 1, versionDescription: 'Psalms 121 · Capo 1 · F · G · Em · Am · Bbm' }
  ),

  kardunerSong(
    'mizmor-letoda-yonatan',
    'Mizmor LeTodah — Yonatan Razel (מזמור לתודה)',
    'A',
    `[בית א']
G  C  D
הריעו לה' כל הארץ
G  C  D
עבדו את ה' בשמחה
Cmaj7  Am7
באו לפניו ברננה
Bm7  Em7  Am7  Bm7
דעו כי ה' הוא אלוהים הוא עשנו ולו אנחנו עמו וצאן מרעיתו

[פזמון]
Em  Am7  Bm7
נה נה נה נה נה נה נה 3x
Em  Am7  Bm7  Em
נה נה נה נה נה נה נה

[בית ב']
G  C  D
באו שעריו בתודה חצרותיו בתהילה
G  C  D
הודו לו ברכו שמו
Cmaj7  Am7
כי טוב ה' לעולם חסדו
Bm7  Em7  Am7  Bm7
ועד דור ודור אמונתו
`,
    { capo: 2, versionDescription: 'Psalms 100 · Yonatan Razel arr. · Capo 2 · Em · G · C · D · A' }
  ),
]
