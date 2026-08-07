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
