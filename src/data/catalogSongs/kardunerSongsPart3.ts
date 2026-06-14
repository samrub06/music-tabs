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

export const KARDUNER_SONGS_PART3: KardunerSong[] = [
  kardunerSong(
    'hodu-lhashem',
    'Hodu L\'Hashem (הודו לה\')',
    'Ab',
    `[הודו לה']
D7 Am7 C G       D7 Am7 C G
הודו לה' קראו בשמו הודיעו בעמים עלילותיו
D7 Am7 C G       D7 Am7 C G
שירו לו זמרו לו שיחו בכל נפלאותיו
D7 Am7 C G       D7 Am7 C G
התהללו בשם קדשו ישמח לב מבקשי ה'
D C Em D7 Am7 C G
דרשו ה' ועזו בקשו פניו תמיד.
`,
    { capo: 1, versionDescription: 'Psalms 105 · Capo 1 · Ab · D7 · Am7 · C · G' }
  ),

  kardunerSong(
    'shir-lamaalot-eb',
    'Shir LaMa\'alot — Eb (שיר למעלות)',
    'Eb',
    `[שיר למעלות]
Bm      Em D      G
שיר למעלות אשא עיני אל ההרים:
Bm        Em    A      D    G
מאין יבוא עזרי? עזרי מעם ה' עושה שמים וארץ.
Bm      G      A    D
אל יתן למוט רגלך אל ינום שומרך:
Bm      F#7    Bm      Em      G
הנה לא ינום ולא יישן שומר ישראל. ה' שומרך ה' צלך
D G A D
על יד ימינך:

Bm      Em D      G
יומם השמש לא יככה וירח בלילה:
Bm        Em    A      D    G
ה' ישמרך מכל רע ישמור את נפשך:
Bm      G      A    D
ה' ישמור צאתך ובואך מעתה ועד עולם:
Bm      F#7    Bm      Em      G
הנה לא ינום ולא יישן שומר ישראל. ה' שומרך ה' צלך
D G A D
על יד ימינך:

Bm      G      A    D
אל יתן למוט רגלך אל ינום שומרך:
Bm      F#7    Bm      Em      G
הנה לא ינום ולא יישן שומר ישראל. ה' שומרך ה' צלך
D G A D
על יד ימינך:

לא ינום
`,
    { capo: 1, versionDescription: 'Psalms 121 · Capo 1 · Eb · Bm · Em · G · A · D' }
  ),

  kardunerSong(
    'ki-el-tov-vesalach',
    'Ki El Tov VeSalach (כי אל טוב וסלח)',
    'F#m',
    `[כי אל טוב וסלח]
Dm C/E F
ועתה אבוא לפניך ואתחנן לפניך
Dm Am7 Gm7 Dm Am7 C7 Bb
ובטובך הגדול ועוד לפניך תמיד אשתחווה.
Am7 Bbmaj7 Am/C Dm
אף אם על פי דבריך
Dm Am7 Gm7
ואבוא באמונה שלמה
Dm Am7 Gm7 Am7 Bbmaj7 Am/C Dm
כי אע"פ שיש ייאוש בעולם כלל, שיש ייאוש בעולם כלל
Dm Am7 C Bb Dm Am7 C Bb
ויידעו כי לא תעזוב את הקוראים אליך באמת, כי
Dm Am7 C Bb
כי חסדך ד' לא יגמר
Am/C Dm Am7 Gm7
כי לא כלו רחמיך
Dm Am7 Gm7
כי לא כלו רחמיך
`,
    { capo: 1, versionDescription: 'Shacharit · Capo 1 · F#m · Dm · Am7 · Gm7 · Bb' }
  ),

  kardunerSong(
    'shir-lamaalot-em',
    'Shir LaMa\'alot — Em (שיר למעלות)',
    'Em',
    `[שיר למעלות]
Em Am6
אשא עיני אל ההרים מאין יבא עזרי
Am7 D7 C
עזרי מעם ה' עושה שמים וארץ
Em
אל יתן למוט רגלך אל ינום שומרך
Am B7
הנה לא ינום ולא יישן שומר ישראל
Em Am C
ה' שומרך ה' צלך על יד ימינך
Am7 D7 G
יומם השמש לא יככה וירח בלילה

Am7 C
ה' ישמרך מכל רע ישמור את נפשך
G D7
ה' ישמור צאתך ובואך מעתה ועד עולם
Em
אשא עיני אל ההרים מאין יבא עזרי
Am B7
עזרי מעם ה' עושה שמים וארץ
Em Am C
הנה לא ינום ולא יישן שומר ישראל
Am7 D7 G
ה' שומרך ה' צלך על יד ימינך
Em D/F#
אשא עיני אל ההרים
Em B7
עזרי מעם ה' עושה שמים וארץ
`,
    { versionDescription: 'Psalms 121 · Em · Am6 · Am7 · D7 · C · G' }
  ),

  kardunerSong(
    'yisrael-betach',
    'Yisrael Betach BaHashem (ישראל בטח בה\')',
    'Gm',
    `[ישראל בטח בה']
Gm  Dm  Cm  F  Gm
ישראל בטח בה' עזרם ומגינם הוא (תהילים קט"ו) 2x
F  Bb  Eb
אל תירא ד' אתי

Gm  Cm
התחזקו ואל ירפו ידיכם יהיו נסים
Gm  F/A  Bb  F  Eb
כל מי שבוטח בה' לא יירא לעולם
D7  Dsus4  Eb
כמו שעמד בעבר, יעזור לעד ויגן

...ישראל

F  Bb  Eb
בטח באמת ואל תפחד
Cm
התעורר ד' איתי ואתה לא לבד
Gm  F/A  Bb  F  Eb
התחזקו לאלוהינו והוא יראה בשמחתנו
D7  Dsus4  Eb
כשהמשיח יגיע הוא יאסוף את כל הנדחות
`,
    { versionDescription: 'Psalms 115 · Gm · Dm · Cm · F · Bb · Eb' }
  ),

  kardunerSong(
    'shir-lamaalot-em-chorus',
    'Shir LaMa\'alot — Em Chorus (שיר למעלות)',
    'Em',
    `[שיר למעלות]
Em Am6 B7 Em B7 Am6 B7 Em
שיר למעלות אשא עיני אל ההרים מאין יבוא עזרי
Em Am6 B7 Em B7 Am6 B7 Em
עזרי מעם ה' עושה שמים וארץ
Em Am6 B7 Em B7 Am6 B7 Em
אל יתן למוט רגלך אל ינום שומרך
Em Am6 B7 Em B7 Am6 B7 Em
הנה לא ינום ולא יישן שומר ישראל
Em Am6 B7 Em B7 Am6 B7 Em
ה' שומרך ה' צילך על יד ימינך
Em Am6 B7 Em B7 Am6 B7 Em
יומם השמש לא יככה וירח בלילה
Em Am6 B7 Em B7 Am6 B7 Em
ה' ישמרך מכל רע ישמור את נפשך
Em Am6 B7 Em B7 Am6 B7 Em
ה' ישמור צאתך ובואך מעתה ועד עולם

[Chorus]
G C D7 Am7 G C D7 Am7
שיר למעלות אשא עיני אל ההרים מאין יבוא עזרי
G C D7 Am7 G C D7 Am7
עזרי מעם ה' עושה שמים וארץ
2x [...הנה]
`,
    { versionDescription: 'Psalms 121 · Em · Am6 · B7 · G · C · D7' }
  ),

  kardunerSong(
    'shir-lamaalot-e-major',
    'Shir LaMa\'alot — E (שיר למעלות)',
    'E',
    `[שיר למעלות]
B7 E B7 F#m7 C#m7 G#m7 Amaj7 Emaj7
שיר למעלות אשא עיני אל ההרים
E7 E B7 F#m7 C#m7 G#m7 Amaj7 Emaj7 E
מאין יבוא עזרי עזרי מעם ה' עושה שמים וארץ
A C#m G#m C#m G#m A
אל יתן למוט רגלך אל ינום שומרך הנה לא ינום
A C#m G#m C#m G#m A
ולא יישן שומר ישראל ה' שומרך ה' צילך על יד ימינך.

B7 E B7 F#m7 C#m7 G#m7 Amaj7 Emaj7
יומם השמש לא יככה וירח בלילה ה' ישמרך מכל רע
E7 E B7 F#m7 C#m7 G#m7 Amaj7 Emaj7 E
ישמור את נפשך ה' ישמור צאתך ובואך מעתה ועד עולם.
A C#m G#m C#m G#m A
אל יתן למוט רגלך אל ינום שומרך הנה לא ינום
A C#m G#m C#m G#m A
ולא יישן שומר ישראל ה' שומרך ה' צילך על יד ימינך.

E A C#m B7 E
ולא יישן שומר ישראל
`,
    { versionDescription: 'Psalms 121 · E · B7 · F#m7 · C#m7 · Amaj7' }
  ),

  kardunerSong(
    'shir-hamaalot-am',
    'Shir HaMa\'alot — Am (שיר המעלות)',
    'Am',
    `[שיר המעלות]
Am      G        Am  G      Am
שיר המעלות אשא עיני אל ההרים
Am E7        Dm Am  G  Dm
מאין יבוא עזרי עזרי מעם ה'
Am G        Dm Am  G  Dm
עושה שמים וארץ אל יתן למוט
Am E7        Dm Am  G  Dm
רגלך אל ינום שומרך הנה
Am G        Dm Am  G  Dm
לא ינום ולא יישן שומר ישראל

Am  Em          Dm         F
ה' שומרך ה' צלך על יד ימינך
Am  G        Am  G      Am
יומם השמש לא יככה וירח בלילה
Am E7        Dm Am  G  Dm
ה' ישמרך מכל רע ישמור את נפשך
Am G        Dm Am  G  Dm
ה' ישמור צאתך ובואך מעתה ועד עולם

Am  G        Am  G      Am
אשא עיני אל ההרים מאין יבוא עזרי
Am G        Dm Am  G  Dm
עזרי מעם ה' עושה שמים וארץ
Am G        Dm Am  G  Dm
הנה לא ינום ולא יישן שומר ישראל

Am  Em          Dm         F
ה' שומרך ה' צלך על יד ימינך
Am G        Dm Am  G  Dm
ה' ישמרך מכל רע ישמור את נפשך
Am G        Dm Am  G  Dm
ה' ישמור צאתך ובואך מעתה ועד עולם
`,
    { versionDescription: 'Psalms 121 · Am · G · Dm · Em · F · E7' }
  ),

  kardunerSong(
    'bechina',
    'Bechina (בחינה)',
    'D',
    `[בחינה]
D  C  Em D C  Em
ד' יתברך, בנבואותיו
D C Em D C Em
שלח לכל דור ודור וקיים
D  C  Em
שיבטחו בו עם ישראל,
D C Em
עד בואו של הגואל
D C Em D  C  Em
בדרך ישרה לפניו יתברך.
G D C G D C G
עצמו לעורר רחמים
G D C G D C G
אצל כל המכתבים, הסתרות,
D C G D C G
ואותה על האהבה,
G D C G
שכל חסרון אינו אלא באהבה,
B7 C  G  DC  G
באם יתן את רצונו אל האלהים
D  C  Em
חנני, חנני.
4x [

D  C  Em D C  Em
ד' יתברך, בנבואותיו
D C Em D C Em
יעץ את האדם עם הדרכה,
D  C  Em
אם ישמעו ד' ית',
D C Em
על היום האחרון של הירידה.
D C Em D  C  Em
עצמו לעורר רחמים, המכתבים, הסתרות,
G D C G D C G
עצמו לעורר רחמים
G D C G D C G
לאו אתה, ומי זה המכתבים?
D C G D C G
העולם אינו אלא אהבה
B7 C  G  DC  G
וצריכים להתחזק ברוח הנשמה
D  C  Em
באם יתן את רצונו אל האלהים
D  C  Em
חנני, חנני.
4x [
]`,
    { versionDescription: 'Likutey Moharan I #63 · D · C · Em · G · B7' }
  ),
]
