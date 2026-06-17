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
G  C  Am7  D7  G  C  Am7  D7
הודו לה' קראו בשמו הודיעו בעמים עלילותיו
G  C  Am7  D7  G  C  Am7  D7
שירו לו זמרו לו שיחו בכל נפלאותיו
G  C  Am7  D7  G  C  Am7  D7
התהללו בשם קדשו ישמח לב מבקשי ה'
G  C  Am7  D7  Em  C  D
דרשו ה' ועזו בקשו פניו תמיד.
`,
    { capo: 1, versionDescription: 'Psalms 105 · Capo 1 · Ab · G · C · Am7 · D7 · Em' }
  ),

  kardunerSong(
    'mizmor-ledavid',
    'Mizmor LeDavid (מזמור לדוד)',
    'Eb',
    `[מזמור לדוד]
G  D  Em  Bm
מזמור לדוד ה' רועי לא אחסר:
G  D  A  Em  Bm  A
בנאות דשא ירביצני על מי מנוחות ינהלני
D  A  G  Bm
נפשי ישובב ינחני במעגלי צדק למען שמו:
Em  Bm  F#7  G  D  G  A  D
גם כי אלך בגיא צלמות לא אירא רע כי אתה עמדי
G  D  Em  Bm
שבטך ומשענתך המה ינחמני:
G  D  A
תערך לפני שלחן נגד צוררי
Em  Bm  A  D
דשנת בשמן ראשי כוסי רויה:
D  A  G  Bm
אך טוב וחסד ירדפוני כל ימי חיי
Em  Bm  F#7  G  D  G  A  G
ושבתי בבית ה' לאורך ימים לאורך ימים:
D  G  A  D
לאורך ימים
`,
    { capo: 1, versionDescription: 'Psalms 23 · Capo 1 · Eb · G · D · Em · Bm · A · F#7' }
  ),

  kardunerSong(
    'ki-lo-chalu-rachamav',
    'Ki Lo Chalu Rachamav (כי לא כלו רחמיו)',
    'F#m',
    `[כי לא כלו רחמיו]
Dm  C/E  F
ועתה איך אוכל לתקן זאת
Dm  Am7  Gm7  Dm  Am7  C7  Bb
ובמה יזכה נער כמוני לתקן את אשר שיחתי.
Am7  Bbmaj7  Am/C  Dm
אך אף על פי כן ידעתי
Dm  Am7  Gm7
ואני מאמין באמונה שלמה
Dm  Am7  Gm7  Am7  Bbmaj7  Am/C  Dm
כי אין שום ייאוש בעולם כלל. אין שום ייאוש בעולם כלל
Dm  Am7  C  Bb  Dm  Am7  C  Bb
ועדיין יש לי תקוה ועדיין לא אבדה תוחלתי מד'
Dm  Am7  C  Bb
כי חסדי ד' כי לא תמנו
Am/C  Dm  Am7  Gm7
כי לא כלו רחמיו
Dm  Am7  Gm7
כי לא כלו רחמיו
`,
    { capo: 1, versionDescription: 'R\' Nathan · Tikkun HaKlali · Capo 1 · F#m · Dm · Am7 · Gm7 · Bb' }
  ),

  kardunerSong(
    'aleinu-lshabeach',
    'Aleinu L\'shabeach (עלינו לשבח)',
    'Ab',
    `[עלינו לשבח]
Em  Am  D  G
עלינו לשבח לאדון הכל
Em  C
לתת גדולה ליוצר בראשית
Em  Am  D  G
שלא עשנו כגויי הארצות
Em  Am  D  G
ולא שמנו כמשפחות האדמה
C
שלא שם חלקנו כהם
Em
וגורלנו ככל המונם
Am7  C  G  D7
ואנחנו כורעים ומשתחוים ומודים
G  D7
לפני מלך מלכי המלכים
Em  D/F#
הקדוש ברוך הוא
Em  Am6
שהוא נוטה שמים ויוסד ארץ
D7  Am7  C
ומושב יקרו בשמים ממעל
C  G
ושכינת עוזו בגבהי מרומים
B7  Am
הוא אלקינו אין עוד
C  B7  Em
אמת מלכנו אפס זולתו
G  D7  Am7
ככתוב בתורתו: וידעת היום
Am  C
והשבות אל לבבך
Am6  Em  B7
כי ד' הוא האלקים בשמים ממעל
Em  B7
ועל הארץ מתחת אין עוד
`,
    { capo: 1, versionDescription: 'Aleinu · Capo 1 · Ab · Em · Am · D · G · C · B7' }
  ),

  kardunerSong(
    'yisrael-betach',
    'Yisrael Betach BaShem (ישראל בטח בד\')',
    'Gm',
    `[ישראל בטח בד']
Gm  Dm  Cm  F  Gm
ישראל בטח בד' עזרם ומגינם הוא (תהלים קט"ו ט') 2x
F  Bb  Eb
אל תדאג ד' אתך
Gm  Cm
תתחזק ואל תפחד עוד יהיו ניסים
Gm  F/A  Bb  F  Eb
כל מי שבוטח בד' לא לא מפסיד
D7  Dsus4  Eb
כמו שעזר בעבר יעזור לנו תמיד

...ישראל

F  Bb  Eb
בטח באחד ואל תפחד
Gm  Cm
תתעודד ד' אתך אתה לא לבד
Gm  F/A  Bb  F  Eb
תסתכל לאחור ותראה כמה ישועות
D7  Dsus4  Eb
כשהשם רוצה הוא מסלק את כל הצרות
`,
    { versionDescription: 'Psalms 115:9 · Gm · Dm · Cm · F · Bb · Eb' }
  ),

  kardunerSong(
    'batzar-lahem',
    'Batzar Lahem (בצר להם)',
    'Em',
    `[בצר להם]
B7  Em  B7  Am6  Am  Em
הודו לד' כי טוב כי לעולם חסדו
C  B7  Am6  Am  Em
הודו לד' כי טוב כי לעולם חסדו
Em  B7  Am6
יאמרו גאולי ד' אשר גאלם מיד צר
Em  B7  Em  B7  Am6  Am  C
ומארצות קבצם ממזרח וממערב מצפון ומים
B7  Em  B7  Am6  Am  Em
תעו במדבר בישימון דרך עיר מושב לא מצאו
C  B7  Am6  Am  Em
רעבים גם צמאים נפשם בהם תתעטף
Em  B7  Am6  Am  C  Em  B7  Am6  Am  C
ויצעקו אל ד' בצר להם בצר להם ממצוקותיהם יצילם
B7  Em  B7  Am6  Am  Em
וידריכם בדרך ישרה ללכת אל עיר מושב
C  B7  Am6  Am  Em
יודו לד' חסדו ונפלאותיו לבני אדם
Em  B7  Am6  Am  C
כי השביע נפש שוקקה ונפש רעבה מלא טוב
Em  B7  Am6  Am  C
ישבי חשך וצלמות אסירי עוני וברזל
Em  B7  Am6  Am  Em
כי המרו אמרי קל ועצת עליון נאצו
C  B7  Am6  Am  Em
ויכנע בעמל לבם כשלו ואין עוזר
D7  Em  B7  Am  C  Em  B7  Am6  Am  C
ויזעקו אל ד' בצר להם בצר להם ממצוקותיהם יושיעם
C  G  D7  Am7  C  G
יוציאם מחשך וצלמות ומוסרותיהם ינתק
Em  B7  Am  C  G
יודו לד' חסדו ונפלאותיו לבני אדם
Em  B7  Am6  Am  C
2x [...תנני]
`,
    { versionDescription: 'Psalms 107 · Em · Am6 · B7 · G · C · D7' }
  ),

  kardunerSong(
    'yedid-nefesh',
    'Yedid Nefesh (ידיד נפש)',
    'E',
    `[ידיד נפש]
B7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
ידיד נפש אב הרחמן משוך עבדך אל רצונך
E7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
ירוץ עבדך כמו איל ישתחוה אל מול הדרך
A  C#m  G#m  C#m  G#m  A
יערב לו ידידותיך מנופת צוף וכל טעם

B7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
הדור נאה זיו העולם נפשי חולת אהבתך
E7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
אנא קל נא רפא נא לה בהראות לה נועם זיוך
A  C#m  G#m  C#m  G#m  A
אז תתחזק ותתרפא והיתה לה שמחת עולם

B7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
ותיק ותיק יהמו נא רחמיך וחוסה נא על בן אהובך
E7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
כי זה כמה נכסוף נכספתי לראות מהרה בתפארת עוזך
A  C#m  G#m  C#m  G#m  A
אלה חמדה חמדה לבי וחוסה נא ואל תתעלם

B7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
הגלה הגלה נא ופרוס חביבי עלי את סוכת שלומך
E7  E  B7  F#m7  C#m7  G#m7  Amaj7  Emaj7  E
תאיר ארץ מכבודך נגילה ונשמחה בך
A  C#m  G#m  C#m  G#m  A
מהר אהוב כי בא מועד וחננו כימי עולם
E  A  C#m  B7  E
וחננו כימי עולם
`,
    { versionDescription: 'Sefer Charedim · E · B7 · F#m7 · C#m7 · Amaj7' }
  ),

  kardunerSong(
    'min-hametzar',
    'Min HaMetzar (מן המצר)',
    'Am',
    `[מן המצר]
Am  G  Am  G  Am
מן המצר קראתי י-ה ענני במרחב י-ה
Am  E7  Dm  Am  G  Dm
ד' לי לא אירא מה יעשה לי אדם
Am  G  Dm  Am  G  Dm
ד' לי בעוזרי ואני אראה בשונאי
Am  G  Am  G  Am
טוב לחסות בד' מבטוח באדם
Am  E7  Dm  Am  G  Dm
טוב לחסות בד' מבטוח בנדיבים
Am  G  Dm  Am  G  Dm
כל גויים סבבוני בשם ד' כי אמילם
Am  Em  Dm  F
סבוני גם סבבוני בשם ד' כי אמילם
Am  Em  Dm  F
סבוני כדבורים דועכו כאש קוצים בשם ד' כי אמילם
Am  G  Am  G  Am
דחה דחיתני לנפול וד' עזרני
Am  E7  Dm  Am  G  Dm
עזי וזמרת י-ה ויהי לי לישועה
Am  G  Dm  Am  G  Dm
קול רינה וישועה באהלי צדיקים ימין ד' עושה חיל
Am  G  Am  G  Am
ימין ד' רוממה ימין ד' עושה חיל
Am  G  Dm  Am  G  Dm
לא אמות כי אחיה ואספר מעשי י-ה
Am  G  Dm  Am  G  Dm
יסר יסרני י-ה ולמות לא נתנני
Am  G  Am  G  Am
אודך כי עניתני ותהי לי לישועה
Am  G  Dm  Am  G  Dm
אבן מאסו הבונים היתה לראש פינה
Am  G  Dm  Am  G  Dm
מאת ד' היתה זאת היא נפלאת בעינינו
Am  Em  Dm  F  C  G  Dm
זה היום עשה ד' נגילה ונשמחה בו
Am  Em  Dm  F
פתחו לי שערי צדק אבוא בם אודה י-ה
Am  Em  Dm  F
זה השער לד' צדיקים יבואו בו
`,
    { versionDescription: 'Psalms 118 · Am · G · Dm · E7 · Em · F · C' }
  ),

  kardunerSong(
    'bechira',
    'Bechira (בחירה)',
    'Em',
    `[בחירה]
D  C  Em  D  C  Em
ד' יתברך בנפלאותיו
D  C  Em  D  C  Em
יצר את האדם עם בחירה
D  C  Em
אם לעשות רצון ד'
D  C  Em
או חס ושלום אם לאו
D  C  Em  D  C  Em
עד היום האחרון יש בחירה
D  C  G  D  C  G
עצור לרגע, תתבונן ותביט
D  C  G  D  C  G
לאן אתה רץ, מה התכלית?
D  C  G
העולם הוא רק פרוזדור
D  C  G
לחיי העולם הבא
B7  C  G  D  C  G
וצריך להתחזק לחזור בתשובה
4x [
D  C  Em
תייי תייי
]

D  C  Em  D  C  Em
ד' יתברך בנפלאותיו
D  C  Em  D  C  Em
שלח לנו בכל דור צדיקים
D  C  Em
שיובילו את עם ישראל
D  C  Em
עד ביאתו של גואל
D  C  Em  D  C  Em
בדרך הישר לפניו יתברך
G  D  C  G
עצור לרגע ותשליך
G  D  C
את כל החכמות, תסתכל
D  C  G  D  C
ותודה על האמת
D  C  G  D  C  G
שכל תקוותנו היא בזכות הצדיקים
B7  C  G  D  C  G
בא ניתן את לבנו אליהם
4x [
D  C  Em
תייי תייי
]
`,
    { versionDescription: 'Likutei Tefilot 129 · Em · D · C · G · B7' }
  ),

  kardunerSong(
    'shemot-hatzadikim',
    'Shemot HaTzadikim (שמות הצדיקים)',
    'F#m',
    `[שמות הצדיקים]

[בית א']
Bm7  Am7  Bm7  Em
רבי שמעון בר יוחאי
Bm7  Am7  Bm7  Em
רבי שמעון צדיקא
Bm7  Am7  Bm7  Em
רבי יהודה בר עלאי
Bm7  Am7  Bm7  Em
רבי כרוספדאי
Bm7  Am7  Bm7  Em
רבי יוחנן הסנדלר
Bm7  Am7  Bm7  Em
רבי ישבב הסופר
Bm7  Am7  Bm7  Em
רבן שמעון בן גמליאל (נשיא ישראל)
Am7  Bm7  Em
חוני המעגל

[בית ב']
Bm7  Am7  Bm7  Em
רבי נחוניה בן הקנה
Bm7  Am7  Bm7  Em
רבי יהושע בן חנניה
Bm7  Am7  Bm7  Em
רבי יהודה בן דמא
Bm7  Am7  Bm7  Em
רבי יהודה בן בבא
Bm7  Am7  Bm7  Em
רבי יוחנן בן זכאי
Bm7  Am7  Bm7  Em
רבי מאיר בעל הנס
Bm7  Am7  Bm7  Em
רבי יהודה הנשיא
Am7  Bm7  Em
רבי פנחס בן יאיר

[פזמון]
D  C
על ידי הזכרת שמות הצדיקים
D  C
יכולים להביא שינוי במעשה בראשית
Em
כלומר לשנות את הטבע

...פזמון
רבי חנינא בן דוסא
רבי שמעון בן שטח, רבי חנינא בן תרדיון
הלל, שמאי, רבי עקיבא, רבי יונתן בן עוזיאל
רבי יוסי דמן יוקרת, רבי שמעון בן נתנאל
רבי חוצפית המתורגמן, רבי חייא, רב אמי ורב אסי
רבינא ורב אשי, רב כהנא, רבי יצחק נפחא
רבי אלעזר בן שמוע, רבי חנינא בן חכינאי
האר"י הקדוש, רבי חיים בן עטר, הבעל שם טוב
רבי נחמן מברסלב
`,
    { capo: 2, versionDescription: 'Sefer HaMidot · Tzadik §20 · Capo 2 · F#m · Bm7 · Em · D · C' }
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
