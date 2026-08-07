/**
 * Popularity-first catalog sources.
 *
 * "Spotify" here means researching what people stream (public chart pages + AI),
 * NOT the Spotify Web API.
 */
export type SpotifyPopularMarketHint = 'IL' | 'INTL'

export type PopularResearchMode = 'chart' | 'ai'

export type SpotifyPopularSource = {
  /** Stable key for --source= CLI filter */
  key: string
  name: string
  marketHint?: SpotifyPopularMarketHint
  /** Curated playlist slug to update with scraped song_ids */
  targetSlug: string
  /** Catalog genre tag written on upserted songs */
  catalogGenre: string
  description?: string
  /**
   * chart = fetch public Spotify daily chart mirror (kworb)
   * ai = ask OpenAI to research popular tracks for this shelf
   */
  researchMode: PopularResearchMode
  /** Public chart URL when researchMode === 'chart' */
  chartUrl?: string
  /** Research brief when researchMode === 'ai' */
  aiPrompt?: string
}

/**
 * Top charts (web mirror of Spotify daily) + AI-researched Jewish/Israeli shelves.
 */
export const SPOTIFY_POPULAR_SOURCES: SpotifyPopularSource[] = [
  {
    key: 'top-israel',
    name: 'Top 50 — Israel',
    marketHint: 'IL',
    targetSlug: 'spotify-top-israel',
    catalogGenre: 'spotify-top-israel',
    description: 'Spotify daily Israel (public chart) → Tab4U/Negina',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/il_daily.html',
  },
  {
    key: 'top-global',
    name: 'Top 50 — Global',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-global',
    catalogGenre: 'spotify-top-global',
    description: 'Spotify daily Global (public chart) → Ultimate Guitar',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/global_daily.html',
  },
  {
    key: 'top-france',
    name: 'Top 50 — France',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-france',
    catalogGenre: 'spotify-top-france',
    description: 'Spotify daily France (public chart) → Ultimate Guitar',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/fr_daily.html',
  },
  {
    key: 'editorial-hassidic',
    name: 'Hassidic hits (popular)',
    marketHint: 'IL',
    targetSlug: 'hassidic',
    catalogGenre: 'hebrew-hassidic',
    description: 'AI research of popular Hassidic / חסידי hits → hassidic shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular Hassidic / חסידי Jewish songs that people stream a lot (Shwekey, Fried, Motty Steinmetz, Beri Weber, Miami Boys Choir, Zanvil Weinberger, Breslov nigunim, etc.). Prefer well-known hits with chords/tabs. Titles and artists in Hebrew when that is how they are known.',
  },
  {
    key: 'editorial-religious-il',
    name: 'Israeli religious / faith-pop (popular)',
    marketHint: 'IL',
    targetSlug: 'hassidic',
    catalogGenre: 'hebrew-hassidic',
    description:
      'AI research of popular Israeli Jewish religious & faith-pop hits → hassidic shelf (complements editorial-hassidic)',
    researchMode: 'ai',
    aiPrompt:
      'Popular Israeli Jewish religious, liturgical, and faith-pop songs people stream and play on guitar — NOT Christian worship. Include Hassidic/חסידי staples plus modern faith-pop (Ishay Ribo, Hanan Ben Ari, Ben Zur, Akiva, Yosef Karduner, Shwekey, Carlebach-style nigunim, wedding/Shabbat favorites). Prefer Hebrew titles as commonly written. Favor songs that typically have Tab4U/Negina chords.',
  },
  {
    key: 'editorial-acoustic',
    name: 'Acoustic guitar staples (popular)',
    marketHint: 'INTL',
    targetSlug: 'acoustic',
    catalogGenre: 'acoustic',
    description: 'AI research of popular acoustic / campfire guitar hits → acoustic shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular acoustic / campfire / singer-songwriter songs people play on guitar (Spotify “Acoustic Hits” vibe). Prefer Ed Sheeran, Vance Joy, Passenger, The Lumineers, George Ezra, Jason Mraz, John Mayer, Jack Johnson, Lewis Capaldi, Hozier, Tracy Chapman, Bon Iver, Oasis Wonderwall, Hallelujah, Riptide, Perfect, Photograph, Thinking Out Loud, Let Her Go, Ho Hey, I’m Yours, Fast Car, and similar staples. English titles. Favor songs that commonly have Ultimate Guitar chord sheets. Exclude heavy electronic/rap without acoustic guitar arrangements.',
  },
  {
    key: 'editorial-french-variete',
    name: 'Variété française (popular)',
    marketHint: 'INTL',
    targetSlug: 'variete-francaise',
    catalogGenre: 'french-variete',
    description: 'AI research of popular French variété / chanson → variete-francaise shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular French variété / chanson / pop songs for guitar: Vianney, Kendji Girac, Angèle, Stromae, Francis Cabrel, Jean-Jacques Goldman, Gims (crossover pop), Louane, Calogero, Zazie, Indochine, classics (Brel, Aznavour, Brassens) that still get played. French titles as commonly written. Prefer tracks with Ultimate Guitar chords. Exclude pure trap with no chord sheets.',
  },
  {
    key: 'editorial-rap-fr',
    name: 'Rap FR (popular, guitar-playable)',
    marketHint: 'INTL',
    targetSlug: 'rap-fr',
    catalogGenre: 'french-rap',
    description: 'AI research of popular French rap with playable chords → rap-fr shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular French rap / urban hits that guitarists actually look up on Ultimate Guitar (melodic hooks, widely covered): Maître Gims / Gims, PNL (accessible hits), Damso, Nekfeu, Bigflo & Oli, Stromae crossover, Jul (biggest melodic hits), Lomepal. Prefer French titles. Strongly prefer songs known to have chord sheets; skip obscure underground tracks with no tabs.',
  },
  {
    key: 'editorial-ribo',
    name: 'Ishay Ribo (popular)',
    marketHint: 'IL',
    targetSlug: 'ishay-ribo',
    catalogGenre: 'hebrew-ribo',
    description: 'AI research of popular Ishay Ribo tracks → ishay-ribo shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Ishay Ribo (ישי ריבו) songs — his biggest hits and currently well-known tracks. Artist must be Ishay Ribo / ישי ריבו. Prefer Hebrew titles as commonly written. Include: הלב שלי, סדר העבודה, נפשי, לשוב הביתה, הנה ימים באים, לכשאשתנה, תוכו רצוף אהבה, אם ננעלו, מילים של רוח, אדון עולם, and other chart/streaming staples.',
  },
  {
    key: 'editorial-ben-zur',
    name: 'Ben Zur (popular)',
    marketHint: 'IL',
    targetSlug: 'ben-zur',
    catalogGenre: 'hebrew-ben-zur',
    description: 'AI research of popular Ben Zur tracks → ben-zur shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Ben Zur (בן צור, also Ben Tzur) songs — NOT Hanan Ben Ari. Biggest hits and current tracks: אבא, כל עכבה לטובה, נשמות צמאות, תשליך, אהבת השם, הוויה, אמונה, הכל בסדר, גאולה, אישתי, טאטע תטהר, סיפורי צדיקים, הבת של המלך, etc. Artist must be בן צור / Ben Zur. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-eyal-golan',
    name: 'Eyal Golan (popular)',
    marketHint: 'IL',
    targetSlug: 'eyal-golan',
    catalogGenre: 'hebrew-eyal-golan',
    description: 'AI research of popular Eyal Golan tracks → eyal-golan shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Eyal Golan (אייל גולן) songs — Mediterranean Israeli pop hits. Include classics and recent chart tracks: עם ישראל חי, הלב שלי, ימים יגידו, מחזיק לך את היד, בית מזכוכית, פרחים מנייר, זרה, לב של גבר, אין לי אותך, מזל, מי שמאמין, etc. Artist must be אייל גולן / Eyal Golan. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-omer-adam',
    name: 'Omer Adam (popular)',
    marketHint: 'IL',
    targetSlug: 'omer-adam',
    catalogGenre: 'hebrew-omer-adam',
    description: 'AI research of popular Omer Adam tracks → omer-adam shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Omer Adam (עומר אדם) songs — biggest hits and current tracks. Include: תל אביב, השתגע העולם, קרוב אלייך, בא לי לחגוג, חולה עלייך, שקיעות אדומות, שתיים בלילה, בן 32, פלאזה אתנה, משפחה וכבוד, צמוד צמוד, etc. Artist must be עומר אדם / Omer Adam. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-eden-hason',
    name: 'Eden Hason (popular)',
    marketHint: 'IL',
    targetSlug: 'eden-hason',
    catalogGenre: 'hebrew-eden-hason',
    description: 'AI research of popular Eden Hason tracks → eden-hason shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Eden Hason (עדן חסון) songs. Include: שמישהו יעצור אותי, שקיעות אדומות, כפיות, עיניים, אל תשברי לי את הלב, גדל לי קצת זקן, מדליקה לי הכל, אדם שבור, אהובה שלי, etc. Artist must be עדן חסון / Eden Hason. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-sarit-hadad',
    name: 'Sarit Hadad (popular)',
    marketHint: 'IL',
    targetSlug: 'sarit-hadad',
    catalogGenre: 'hebrew-sarit-hadad',
    description: 'AI research of popular Sarit Hadad tracks → sarit-hadad shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Sarit Hadad (שרית חדד) songs — Mizrahi classics and hits. Include: הייתי בגן עדן, כמו סינדרלה, כשהלב בוכה, אהבה כמו שלנו, אתה תותח, חגיגה, etc. Artist must be שרית חדד / Sarit Hadad. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-moshe-peretz',
    name: 'Moshe Peretz (popular)',
    marketHint: 'IL',
    targetSlug: 'moshe-peretz',
    catalogGenre: 'hebrew-moshe-peretz',
    description: 'AI research of popular Moshe Peretz tracks → moshe-peretz shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Moshe Peretz (משה פרץ) songs. Include: אש, הללויה, אמא, גיבור של אמא, זיקוקים, אלייך, כוס של יין, etc. Artist must be משה פרץ / Moshe Peretz. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-nathan-goshen',
    name: 'Nathan Goshen (popular)',
    marketHint: 'IL',
    targetSlug: 'nathan-goshen',
    catalogGenre: 'hebrew-nathan-goshen',
    description: 'AI research of popular Nathan Goshen tracks → nathan-goshen shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Nathan Goshen (נתן גושן) songs. Include: כל מה שיש לי, מה אם נתנשק, שני ילדים בעולם, גבולות הגיון, דברי איתי יותר, איפה את, 26, etc. Artist must be נתן גושן / Nathan Goshen. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-idan-raichel',
    name: 'Idan Raichel (popular)',
    marketHint: 'IL',
    targetSlug: 'idan-raichel',
    catalogGenre: 'hebrew-idan-raichel',
    description: 'AI research of popular Idan Raichel tracks → idan-raichel shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Idan Raichel Project (הפרויקט של עידן רייכל) songs. Include: ממעמקים, שאריות של החיים, בלילה, אם תלך, שושנים עצובות, הינך יפה, מילים יפות מאלה, בואי, מכל האהבות, etc. Artist must be עידן רייכל / Idan Raichel. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-shlomo-artzi',
    name: 'Shlomo Artzi (popular)',
    marketHint: 'IL',
    targetSlug: 'shlomo-artzi',
    catalogGenre: 'hebrew-shlomo-artzi',
    description: 'AI research of popular Shlomo Artzi tracks → shlomo-artzi shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Shlomo Artzi (שלמה ארצי) songs — Israeli classics. Include: היא לא יודעת מה עובר עלי, ירח, אבסורד, אהבתיה, ארץ חדשה, תתארו לכם, מנגב לך את הדמעות, etc. Artist must be שלמה ארצי / Shlomo Artzi. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-static-ben-el',
    name: 'Static & Ben El (popular)',
    marketHint: 'IL',
    targetSlug: 'static-ben-el',
    catalogGenre: 'hebrew-static-ben-el',
    description: 'AI research of popular Static & Ben El tracks → static-ben-el shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Static & Ben El (סטטיק ובן אל תבורי) songs. Include: סלסולים, זהב, טודו בום, ברבי, אפס מאמץ, הכל לטובה, נמסטה, גומיגם, etc. Artist must be סטטיק / בן אל תבורי / Static & Ben El. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-noa-kirel',
    name: 'Noa Kirel (popular)',
    marketHint: 'IL',
    targetSlug: 'noa-kirel',
    catalogGenre: 'hebrew-noa-kirel',
    description: 'AI research of popular Noa Kirel tracks → noa-kirel shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Noa Kirel (נועה קירל) songs. Include: פנתרה, מיליון דולר, פאוץ, בנות כמוני לא בוכות, Unicorn, אם אתה גבר, או לה פופה, כל מה שאני רוצה, בריידזילה, אמבולנס, פרובוקטיבית, טרילילי טרללה, יהלומים. Artist must be נועה קירל / Noa Kirel. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-itay-levi',
    name: 'Itay Levi (popular)',
    marketHint: 'IL',
    targetSlug: 'itay-levi',
    catalogGenre: 'hebrew-itay-levi',
    description: 'AI research of popular Itay Levi tracks → itay-levi shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Itay Levi (איתי לוי) songs. Include: מערב ראשון, קירות, אין לי מקום אחר, שתישרף האהבה, נחלת בנימין, הטעות הכי יפה, חולה ירח, מרכז תל אביב, חתונת השנה, פרח בשממה, חצי בשבילי. Artist must be איתי לוי / Itay Levi. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-osher-cohen',
    name: 'Osher Cohen (popular)',
    marketHint: 'IL',
    targetSlug: 'osher-cohen',
    catalogGenre: 'hebrew-osher-cohen',
    description: 'AI research of popular Osher Cohen tracks → osher-cohen shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Osher Cohen (אושר כהן) songs. Include: אהבה, פלסטרים, מנגן ושר, אין אותי, ככה וככה, אני פה, לופ, כולם גנבים, ברגעים שאת הולכת, באמת של האמת, תרקדי, גיטרה ולנשום. Artist must be אושר כהן / Osher Cohen. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-avi-ohayon',
    name: 'Avi Ohayon (popular songwriter)',
    marketHint: 'IL',
    targetSlug: 'avi-ohayon',
    catalogGenre: 'hebrew-avi-ohayon',
    description: 'AI research of popular Avi Ohayon–written hits → avi-ohayon shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular Israeli hits written/composed by Avi Ohayon (אבי אוחיון) — he is primarily a songwriter, not a front-line singer. Prefer well-known streamed tracks he wrote: דרך השלום (פאר טסי), תבואי היום (אייל גולן), רסיסים (רביב כנר), קירות (איתי לוי), תפסת לי מקום (בניה ברבי), תל אביב בלילה (עדן בן זקן), מביט מהצד / אז הלכתי / חצי דפוק (עומר אדם), מה עבר עליי (עדן חסון), קו הדממה / שירים וחלומות (his own). Titles in Hebrew; artist field may be the performer.',
  },
]

export function getSpotifyPopularSource(
  key: string
): SpotifyPopularSource | undefined {
  return SPOTIFY_POPULAR_SOURCES.find((s) => s.key === key)
}

export function listConfiguredSpotifyPopularSources(): SpotifyPopularSource[] {
  return SPOTIFY_POPULAR_SOURCES.filter((s) => {
    if (s.researchMode === 'chart') return Boolean(s.chartUrl?.trim())
    return Boolean(s.aiPrompt?.trim())
  })
}
