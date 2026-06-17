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
Dm       C       G  Dm
אלא לכבוד של מלכים, שנאמר בו (משלי כ"ה) "כבוד מלכים חקר דבר",
Am       G       Dm  G
והכל חוקרים אחריו ושואלים: מי הוא זה ואיזהו שחולקים לו כבוד הזה
Am  G  Dm       Am7       D       Dsus4       
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
    'leinyan-hitchazkut',
    'Le\'inyan Hitchazkut (לענין התחזקות)',
    'Ab',
    `[לענין התחזקות]
G       C
לענין התחזקות
Am      Em      C       G
לבל יפל האדם בדעתו מחמת ריבוי הפגמים
D
והקלקולים שקלקל על ידי מעשיו,
Dsus4
ענה ואמר:

2x [
G       C
אם אתה מאמין,
Em      D
שיכולין לקלקל,
Em      B7      Am
תאמין שיכולין לתקן:
]

2x [
G
אם אתה מאמין,
G       C
שיכולין לקלקל,
Em      B7      Am
תאמין שיכולין לתקן:
]`,
    { capo: 1, versionDescription: 'Likutey Moharan II #112 · Capo 1 · G · Em · Am · B7 · Ab' }
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
    'ho-abba',
    'Ho Abba (הו אבא)',
    'F#m',
    `[הו אבא]
Em              Am              Em
הו אבא, הו אבא, אנא כפר על חטאתנו
Em              Am              Em
הו אבא, הו אבא, סלח לנו על עוונותינו

Em              Am              Em              Am
מעכשיו אנו מתחיילים להיות יהודים טובים
Em              Am              Em              Am
להקשיב לצדיקים שמסרו נפשם עלינו

Em              Am              Em
הו אבא, הו אבא, אנא הצלח את דרכנו
Em              Am              Em              Am
הו אבא, הו אבא, אנא הסר כל מכשולנו

Em              Am              Em              Am
נעבוד אותך בזריזות, בתמימות ובפשיטות
Em              Am              Em              Am
ונשמור על האחדות בקרב חברינו

Em              Am              Em
הו אבא, הו אבא, הטה אזנך עננו
Em              Am              Em              Am
הו אבא, הו אבא, אנא שמח את נפשנו
`,
    { capo: 2, versionDescription: 'Capo 2 · Em · Am · F#m' }
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
    'tzadik-katamar',
    'Tzadik Katamar (צדיק כתמר)',
    'Bm',
    `[צדיק כתמר]
2x [
Bm  F#m
צדיק כתמר יפרח,
G  D
כארז בלבנון ישגה
A  G
שתולים בבית ד',
D  A
בחצרות אלקינו יפריחו:
A  G
עוד ינובון בשיבה,
D  A
דשנים ורעננים יהיו:
A  G
להגיד כי ישר ד',
D  A
צורי ולא עולתה בו:
]

2x [
Bm  F#m
תי ננני נני
G  D  A
תי ננני נני
]`,
    { versionDescription: 'Psalms 92:13 · Bm · F#m · G · D · A' }
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
והמרה שחורה בכל כחו,
Am  G
וכל החולאת הבאין על האדם,
F  E
כולם באין רק מקלקול השמחה
]

...מצוה גדולה

2x [
F  C
תיי ננני ננני
G  Dm
תנננ נני ננני
F  C
תי ננני נני
G
תי נננני...
`,
    { versionDescription: 'Likutey Moharan II #24 · E · F · G · Am · C · Dm' }
  ),

  kardunerSong(
    'ani-maamin',
    'Ani Ma\'amin (אני מאמין)',
    'Bbm',
    `[אני מאמין]
C  F  Em  Am
אני מאמין באמונה שלמה
G6  Am  E7  Bø
בביאת המשיח אני מאמין

2x [
Em  G  F
ואף על פי שיתמהמה
Am  G  F  Am/G  Am
עם כל זה, אחכה לו בכל יום שיבוא.
]

2x [
A  D  E  F#m
...תנני
A  Bm  E
...תנני
]`,
    { capo: 1, versionDescription: 'Thirteen Principles · Capo 1 · Bbm · C · F · Em · Am · G' }
  ),

  kardunerSong(
    'mekor-chochma',
    'Mekor Chochma (מקור חכמה)',
    'A',
    `[בית א']
G  C  D
הוא רבנו מקור חכמה
G  C  D
ואמרתם כה לחי
Cmaj7  Am7
אדוננו מקור חכמה
Bm7  Am7  Em7  Bm7
הוא ראש בני ישראל הוא איש חי

[פזמון]
Em  Am7  Bm7
נחל נובע מקור חכמה 3x
Em  Am7  Bm7  Em
נחל נובע מקור חכמה

[בית ב']
G  C  D
להתחזק בשמחה כל הזמן
G  C  D
להתקרב לרבנו רבי נחמן
Cmaj7  Am7
גם כשנפלת אתה קם
Bm7  Am7  Em7  Bm7
בזכות הצדיק יסוד עולם

[פזמון]
נחל נובע...
`,
    { capo: 2, versionDescription: 'R\' Yitzchak Breiter · Shir Yedidut · Capo 2 · A · G · C · D · Em' }
  ),
]
