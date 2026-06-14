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
Dsus4 D       Am7 Dsus4       D       Am7
כי צריך כל אדם למעט בכבוד עצמו ולהרבות בכבוד המקום
Am7       Dsus4 D       Am7
כי מי שרודף אחר הכבוד, אינו זוכה לכבוד אלקים
Dm  G  C       D
אלא לכבוד של מלכים, שנאמר בו (משלי כ"ה) "כבוד מלכים חקר דבר",
G       Dm  G       Am
והכל חוקרים אחריו ושואלים: מי הוא זה ואיזהו שחולקים לו כבוד הזה
Dsus4 D       Am7       Dm  G  Am
וחולקים עליו שאומרים שאינו ראוי לכבוד הזה.
Dsus4 D       Am7 Dsus4 D       Am7
אבל מי שבורח מן הכבוד, שממעט בכבוד עצמו ומרבה בכבוד המקום,
Am7 Dsus4       D       Am7
אזי הוא זוכה לכבוד אלקים ואז אין בני אדם חוקרים על כבודו
D
אם הוא ראוי אם לאו, ועליו נאמר: (שם):
Am  G       Dm  G       C
"כבוד אלקים הסתר דבר", כי אסור לחקור על הכבוד הזה.] 3x
Am7 Dsus4       D       Am7
ואי אפשר לזכות לכבוד הזה, אלא ע"י תשובה.
`,
    { versionDescription: 'Likutey Moharan 6 · D · Am7 · Dm · G · C' }
  ),

  kardunerSong(
    'lamnatzeach-bineginot',
    'Lamnatzeach BiNeginot (למנצח בנגינות)',
    'Ab',
    `[למנצח בנגינות]
G  C  G  C
למנצח בנגינות מזמור שיר
Em  Am  Em  Am
אלקים יחננו ויברכנו יאר פניו אתנו סלה
D  C  D
לדעת בארץ דרכך בכל גוים ישועתך
Dsus4
ענו ואמרו:

2x [
G  C  G  C
אם אתה מאמין, שיכולים לקלקל
Em  D  Em
אם אתה מאמין, שיכולים לקלקל
B7  Am  B7  Am
תאמין שיכולים לתקן:
]

2x [
G  C  G  C
אם אתה מאמין, שיכולים לקלקל
Em  B7  Am  Em  B7  Am
תאמין שיכולים לתקן:
]`,
    { capo: 1, versionDescription: 'Psalms 67 · Likutey Moharan 112 · Capo 1 · Ab · G · Em · Am' }
  ),

  kardunerSong(
    'gesher-tzar-meod',
    'Gesher Tzar Me\'od (גשר צר מאוד)',
    'Fm',
    `[גשר צר מאוד]
2x [
Em              Am              Em
ודע שהאדם צריך לעבור
Em      B7      Am      Em      Am
על גשר צר מאוד על גשר צר מאוד
]

2x [
Em      B7      Am      Em      B7      G       C       G
והעיקר שלא יתפחד שלא יתפחד כלל
]`,
    { capo: 1, versionDescription: 'Likutey Moharan II #48 · Capo 1 · Fm · Em · Am · B7' }
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

Em              Am              Em              Am
עוונותיי רבים המה, לילה ויום בוכים
Em              Am              Em              Am
להתקרב אליך הם מחכים, משמים נשמע קולם

Em              Am              Em
ה' אבא, הן אבא הן, אנא האר את דרכי
Em              Am              Em
ה' אבא, הן אבא הן, אנא חסד כל עולמים

Em              Am              Em              Am
ועננו אור אבותינו, בתוך הגולה, במהרה בימינו
Em              Am              Em              Am
ונשמור על האחדות בקרב חברינו

Em              Am              Em
ה' אבא, הן אבא הן, אבא השלם אותי
Em              Am
ענני
Em              Am              Em
ה' אבא, הן אבא הן, אנא שמע את נפשי
`,
    { capo: 2, versionDescription: 'Capo 2 · F#m · Em · Am' }
  ),

  kardunerSong(
    'kol-haneshamah',
    'Kol HaNeshamah (כל הנשמה)',
    'C',
    `[כל הנשמה]
2x [
C6  Em/D  Em  B7  G  D7  Am7
כל הנשמה תהלל יה
Em  B7
ונשמת כל חי
]

2x [
C6  Em/D  Em  B7  G  D7  Am7
הללויה הללויה...
Em  B7
הללויה...
]`,
    { versionDescription: 'C6 · Em · B7 · G · D7 · Am7' }
  ),

  kardunerSong(
    'shir-hamaalot-bm',
    'Shir HaMa\'alot — Bm (שיר המעלות)',
    'Bm',
    `[שיר המעלות]
2x [
Bm  F#m
אשא עיני אל ההרים,
G  D
מאין יבוא עזרי.
G  A
עזרי מעם ה',
D  A
עושה שמים וארץ.
]

G  A
אל יתן למוט רגלך,
D  A
אל ינום שומרך.
G  A
הנה לא ינום ולא יישן,
D  A
שומר ישראל.

2x [
Bm  F#m
ה' ישמרך,
G  D  A
ה' צלך על יד ימינך.
Bm  F#m  G  D  A
נה נה נה נה נה נה
]`,
    { versionDescription: 'Psalms 121 · Bm · F#m · G · D · A' }
  ),

  kardunerSong(
    'mitzva-gedola',
    'Mitzva Gedola (מצוה גדולה)',
    'E',
    `[מצוה גדולה]
2x [
E  F  G  Am
מצוה גדולה להיות בשמחה תמיד
G  Am
ולהתגבר להרחיק העצבות
E  F
והדאגה בכל לבב,
G  Am
וכל הפלאות הבאות על האדם,
E  F
כולם באים רק מקלקול השמחה
]

...מצוה גדולה
C  F
נננ נננ ננננ
Dm  G
ננננ ננ נננ
C  F
תי נננ נננ
G
תי נננננ...
`,
    { versionDescription: 'Likutey Moharan II #24 · E · F · G · Am · C · Dm' }
  ),

  kardunerSong(
    'shir-lamaalot-bbm',
    'Shir LaMa\'alot — Bbm (שיר למעלות)',
    'Bbm',
    `[שיר למעלות]
C  F  Em  Am
אשא עיני אל ההרים מאין יבוא עזרי
G6  Am  E7  Bø
עזרי מעם ה' עושה שמים וארץ

2x [
Em  G  F
אל יתן למוט רגלך אל ינום שומרך
Am  G  F  Am/G  Am
הנה לא ינום ולא יישן שומר ישראל.
]

2x [
A  D  E  F#m
ה' שומרך ה' צלך על יד ימינך
A  Bm  E
יומם השמש לא יככה וירח בלילה.
]`,
    { capo: 1, versionDescription: 'Psalms 121 · Capo 1 · Bbm · Em · Am · G · F' }
  ),

  kardunerSong(
    'mizmor-letoda-yonatan',
    'Mizmor LeTodah — Yonatan Razel (מזמור לתודה)',
    'A',
    `[בית א']
D  C  G
הריעו לה' כל הארץ
D  C  G
עבדו את ה' בשמחה
Am7  Cmaj7
באו לפניו ברננה
Bm7  Am7  Em7  Bm7
דעו כי ה' הוא אלוהים הוא עשנו ולו אנחנו עמו וצאן מרעיתו

[פזמון]
Bm7  Am7  Em
נה נה נה נה נה נה נה 3x
Em  Bm7  Am7  Em
נה נה נה נה נה נה נה

[בית ב']
D  C  G
באו שעריו בתודה חצרותיו בתהילה
D  C  G
הודו לו ברכו שמו
Am7  Cmaj7
כי טוב ה' לעולם חסדו
Bm7  Am7  Em7  Bm7
ועד דור ודור אמונתו
`,
    { capo: 2, versionDescription: 'Psalms 100 · Yonatan Razel arr. · Capo 2 · A · D · C · G · Em' }
  ),
]
