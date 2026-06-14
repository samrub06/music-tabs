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

export const KARDUNER_SONGS_PART4: KardunerSong[] = [
  kardunerSong(
    'shir-hamaalot-rabbi',
    'Shir HaMa\'alot — Rabbi (שיר המעלות)',
    'F#m',
    `[בית א']
Bm7 Am7 Bm7 Em
רבי, הנה בן אהובך,
Bm7 Am7 Bm7 Em
רבי, הנה בן עבדך,
Bm7 Am7 Bm7 Em
רבי, הנה בן יקירך,
Bm7 Am7 Bm7 Em
רבי, הנה בן אהובך.
Bm7 Am7 Bm7 Em
רבי, הנה בן יקירך,
Bm7 Am7 Bm7 Em
רבי, הנה בן עבדך,
Bm7 Am7 Bm7 Em
רבי, הנה בן אהובך,
Am7 Bm7 Em
רבי, הנה בן אהובך.

[פזמון]
C D
שיר המעלות אשא עיני אל ההרים
C D
מאין יבוא עזרי
Em
עזרי מעם ה' עושה שמים וארץ.

אל יתן למוט רגלך, אל ינום שומרך.
הנה לא ינום ולא יישן, שומר ישראל.
ה' שומרך, ה' צילך על יד ימינך.
יומם השמש לא יככה, וירח בלילה.
ה' ישמרך מכל רע, ישמור את נפשך.
ה' ישמור צאתך ובואך, מעתה ועד עולם.
`,
    { capo: 2, versionDescription: 'Psalms 121 · Folk melody · Capo 2 · F#m · Bm7 · Em · C · D' }
  ),

  kardunerSong(
    'shir-hamaalot-carlebach',
    'Shir HaMa\'alot — Carlebach (שיר המעלות)',
    'F#m',
    `[בית א']
Bm7 Am7 Bm7 Em
שיר המעלות, אשא עיני אל ההרים,
Bm7 Am7 Bm7 Em
מאין יבוא עזרי.
Bm7 Am7 Bm7 Em
עזרי מעם ה', עושה שמים וארץ.
Bm7 Am7 Bm7 Em
אל יתן למוט רגלך, אל ינום שומרך.
Bm7 Am7 Bm7 Em
הנה לא ינום ולא יישן, שומר ישראל.
Am7 Bm7 Em
שומר ישראל.

[פזמון]
C D
ה' שומרך ה' צלך על יד ימינך.
C D
יומם השמש לא יככה וירח בלילה.
Em
ה' ישמרך מכל רע, ישמור את נפשך.

[בית ב']
Bm7 Am7 Bm7 Em
ה' ישמור צאתך ובואך, מעתה ועד עולם. (x6)
Am7 Bm7 Em
מעתה ועד עולם.
`,
    {
      capo: 2,
      versionDescription:
        'Psalms 121 · Carlebach / Yonatan Razel arr. · Capo 2 · F#m · Bm7 · Em',
    }
  ),

  kardunerSong(
    'mi-sherotze-lashuv',
    'Mi Sherotze Lashuv (מי שרוצה לשוב)',
    'Am',
    `[מי שרוצה לשוב]
Am              Em
מי שרוצה לשוב לד' יתברך,
G               Dm
צריך להיות בקי בהלכה,
F               C
שלא יפיל אותו שום דבר בעולם
G               Am
בין בעליה בין בירידה.

Am              Em              G               Dm
ובכל מה שעובר עליו יחזק את עצמו יחזק את עצמו
F               C               G               Am
ויקיים "אם אסק שמים שם אתה ואציע שאול הנך" (תהלים קל"ט).
`,
    { versionDescription: 'Kitzur Likutey Moharan 6 · Am · Em · G · Dm · F · C' }
  ),

  kardunerSong(
    'modeh-ani',
    'Modeh Ani (מודה אני)',
    'F#m',
    `[מודה אני]
Em Bm D Em
מודה אני לפניך, מלך חי וקיים,
Em Bm D Em
מודה על נפלאותיך, שאתה בורא עולם.
Em Bm D Em
מודה אני על חסדך שגמלת עם אביון,
Em Bm D Em
מודה אני על ניסיך, בכל יום שעה ושעה.

Cmaj7 Em D7 Am
ששמת חלקי מזרע ישראל
E7 G D7 Am7
והשבת אותי לתורתך,
B7 Am6 Cmaj7 Em Am6 Am
וקרבת אותי לצדיקים האמיתיים שבדורנו.

...מודה
E7 G D7 Am7 Cmaj7 Em D7 Am
שקבעת בי אמונתך להיות בכלל מאמינך,
B7 Am6 Cmaj7 Em Am6 Am
שנתת לי חברים טובים מיושבי בית מדרשך.

E7 G D7 Am7 Am Cmaj7
...תננני
2x [
B7 Am6 Cmaj7 Em Am
תיניניניי
]`,
    { capo: 2, versionDescription: 'Capo 2 · F#m · Em · Bm · D · Am · Cmaj7' }
  ),

  kardunerSong(
    'hamavdil',
    'Hamavdil (המבדיל)',
    'Dm',
    `[המבדיל]
Dm Bb Dm Gm Dm
המבדיל בין קודש לחול, חטאתינו הוא ימחול,
F C7 Gm7 Dm Bb
זרענו וכספנו ירבה כחול, וככוכבים בלילה.
Dm A7 Gm Bb
יום פנה כצל תומר, אקרא לקל עלי גומר
Dm A7 Dm Bb
אמר שומר, אתא בוקר וגם לילה.
Dm Bb Dm Gm Dm
צדקתך כהר תבור, על חטאי עבור תעבור,
F C7 Gm7 Dm Bb
כיום אתמול כי יעבור, ואשמורה בלילה.
Dm A7 Gm Bb
חלפה עונת מנחתי, מי יתן מנוחתי,
Dm A7 Dm Bb
יגעתי באנחתי, אשחה בכל לילה.
Dm Bb Dm Gm Dm
קולי בל יונטל, פתח לי שער המנוטל,
F C7 Gm7 Dm Bb
שראשי נמלא טל, קווצותי רסיסי לילה.

Gm Bb
העתר נורא ואיום
Dm A7
אשווע תנה פדיום
Dm A7 Dm Bb
בנשף בערב יום באישון לילה
Dm Gm Dm
קראתיך י-ה הושיעני
Dm Bb
אורח חיים תודיעני
F C7 Gm7 Dm Bb
מדלות תבצעני מיום ועד לילה

Dm A7 Gm Bb
טהר טנוף מעשי, פן יאמרו מכעיסי,
Dm Bb
איה נא אלו-ה עושי, הנותן זמירות בלילה.
Dm Bb Dm Gm Dm
נחנו בידך כחומר, סלח נא על כל חומר,
F C7 Gm7 Dm Bb
יום ליום יביע אומר, ולילה ללילה.
A7 Gm Bb
המבדיל בין קודש לחול, חטאתינו הוא ימחול,
Dm Bb
זרענו וכספנו ירבה כחול,
Dm A7 Dm
וככוכבים בלילה.
`,
    { versionDescription: 'Motzei Shabbat · Dm · Bb · Gm · F · C7 · A7' }
  ),

  kardunerSong(
    'achat-shalti',
    'Achat Sha\'alti (אחת שאלתי)',
    'G',
    `[אחת שאלתי]
2x [
G D7 Am7 Em B7 Am
אחת שאלתי מאת ד',
Em B7 Am Em B7 Am
אחת שאלתי אותה אבקש
]
G D7 G D7
שבתי בבית ד' כל ימי חיי
B7 Am G D7
שבתי בבית ד' כל ימי חיי
G D7 G D7
לחזות בנועם ד' ולבקר בהיכלו
B7 F#ø G D7
לחזות בנועם ד' ולבקר בהיכלו או...
`,
    { versionDescription: 'Psalms 27 · G · D7 · Am7 · Em · B7 · Am' }
  ),

  kardunerSong(
    'mizmor-letoda',
    'Mizmor LeTodah (מזמור לתודה)',
    'Am',
    `[מזמור לתודה]
Am Em Am Em
מזמור לתודה הריעו לד' כל הארץ:
Am Em Fmaj7 Em Em
עבדו את ד' בשמחה בואו לפניו ברננה:
Dm Em F G
דעו כי ד' הוא אלוקים הוא עשנו ולו אנחנו
Dm Em Am Em
עמו וצאן מרעיתו:
Am Em Am Em
בואו שעריו בתודה חצרותיו בתהילה
Am Em Fmaj7 Em Dm Em
הודו לו ברכו שמו: כי טוב ד' לעולם חסדו
F G Dm Em Am
ועד דור ודור אמונתו:
`,
    { versionDescription: 'Psalms 100 · Am · Em · Fmaj7 · Dm · G' }
  ),

  kardunerSong(
    'hayiti-holech-elav',
    'Hayiti Holech Elav (הייתי הולך אליו)',
    'Em',
    `[הייתי הולך אליו]
2x  Em Bm Am  Em Bm Am  Em Bm Am  Em Bm Am
אילו היה לי רבי כמו שלכם
2x  Em Bm Am  Em Bm Am  Cmaj7  D6
הייתי הולך אליו 3x ברגל

2x [
Em  D G  D7  C
ובחזרה הייתי רץ הייתי רץ
Am  Em
לעבוד אותו יתברך כפי מה שקיבלתי מרבי
]`,
    { versionDescription: 'Siach Sarfei Kodesh II #112 · Em · Bm · Am · Cmaj7 · D6' }
  ),

  kardunerSong(
    'kol-rina',
    'Kol Rina (קול רינה)',
    'F',
    `[קול רינה]
Fmaj7 E Fmaj7 E
קול רינה וישועה באהלי צדיקים
Dm E F E F E
ימין ד' ימין ד' עשה חיל עשה חיל:
Fmaj7 E Fmaj7 E
קול רינה וישועה באהלי צדיקים
E Dm F E F E
ימין ד' ימין ד' עושה חיל:
E Fmaj7 G Am
ימין ד' ימין ד' רוממה
Dm F E F E F E
ימין ד' עושה חיל עושה חיל עושה חיל:
E Dm F E F E E Fmaj7 G Am
תי נייני
`,
    { versionDescription: 'Psalms 118 · Fmaj7 · E · Dm · G · Am' }
  ),

  kardunerSong(
    'lev-nishbar',
    'Lev Nishbar (לב נשבר)',
    'C#m',
    `[לב נשבר]
Dm  Am  F  Gm
תיי נניי
Bb  F  Gm  Dm
אוי נני....

2x [
Dm  Gm
חזקו ויאמץ לבבכם
Gm  C  Dm
כל המיחלים להשם:
]
Bb  F  Gm  Dm
לב נשבר ונדכה
Gm  Am  Dm  C6
אלוקים לא תבזה:
Bb  F  Gm
לב נשבר ונדכה
Eø  Am  Dm
אלוקים לא תבזה:
`,
    { versionDescription: 'Psalms 31 & 51 · C#m · Dm · Gm · F · Bb · Am' }
  ),
]
