/**
 * Admin/ops only — classify Negina / Tab4U dump songs into Hebrew catalog genres.
 * Never call from user-facing import/search/add-song paths.
 */
import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai'
import {
  HEBREW_CATALOG_GENRES,
  type HebrewCatalogGenre,
} from '@/data/hebrewCatalogGenres'

export const HEBREW_DUMP_GENRES = [
  HEBREW_CATALOG_GENRES.neginaJewish,
  HEBREW_CATALOG_GENRES.tab4uHassidic,
] as const

export type HebrewClassifierCategory =
  | 'chabad'
  | 'hassidic'
  | 'classic_israeli'
  | 'modern'
  | 'ribo'
  | 'karduner'
  | 'akiva'
  | 'hanan_ben_ari'
  | 'aharon_razel'
  | 'eviatar_banai'
  | 'shuli_rand'
  | 'carlebach'
  | 'unclassified'

export type HebrewSongToClassify = {
  id: string
  title: string
  author: string
}

export type HebrewSongClassification = {
  id: string
  category: HebrewClassifierCategory
  decade: number | null
  confidence: number
  reason: string
  source: 'heuristic' | 'ai'
}

export const CLASSIFY_CONFIDENCE_THRESHOLD = 0.55
/** Second-pass threshold for Tab4U residue / aggressive mode. */
export const CLASSIFY_AGGRESSIVE_CONFIDENCE_THRESHOLD = 0.4
export const CLASSIFY_BATCH_SIZE = 20
const BATCH_DELAY_MS = 400

export type ClassifyHebrewSongsOptions = {
  onBatch?: (results: HebrewSongClassification[]) => void
  /**
   * Aggressive second pass (Tab4U residue): lower threshold prompt +
   * default remaining unclassified → hassidic.
   */
  aggressive?: boolean
}

const VALID_DECADES = new Set([1960, 1970, 1980, 1990, 2000, 2010, 2020])

const CATEGORY_TO_GENRE: Record<HebrewClassifierCategory, HebrewCatalogGenre> = {
  chabad: HEBREW_CATALOG_GENRES.chabad,
  hassidic: HEBREW_CATALOG_GENRES.hassidic,
  classic_israeli: HEBREW_CATALOG_GENRES.classicIsraeli,
  modern: HEBREW_CATALOG_GENRES.modern,
  ribo: HEBREW_CATALOG_GENRES.ribo,
  karduner: HEBREW_CATALOG_GENRES.karduner,
  akiva: HEBREW_CATALOG_GENRES.akiva,
  hanan_ben_ari: HEBREW_CATALOG_GENRES.hananBenAri,
  aharon_razel: HEBREW_CATALOG_GENRES.aharonRazel,
  eviatar_banai: HEBREW_CATALOG_GENRES.eviatarBanai,
  shuli_rand: HEBREW_CATALOG_GENRES.shuliRand,
  carlebach: HEBREW_CATALOG_GENRES.carlebach,
  unclassified: HEBREW_CATALOG_GENRES.neginaJewish,
}

/** Genre → curated playlist slug for rebuild after classify. */
export const CLASSIFY_GENRE_TO_PLAYLIST_SLUG: Partial<
  Record<HebrewCatalogGenre, string>
> = {
  [HEBREW_CATALOG_GENRES.chabad]: 'chabad-nigunim',
  [HEBREW_CATALOG_GENRES.hassidic]: 'hassidic',
  [HEBREW_CATALOG_GENRES.classicIsraeli]: 'classic-israeli',
  [HEBREW_CATALOG_GENRES.modern]: 'modern-israeli',
  [HEBREW_CATALOG_GENRES.ribo]: 'ishay-ribo',
  [HEBREW_CATALOG_GENRES.karduner]: 'yosef-karduner',
  [HEBREW_CATALOG_GENRES.akiva]: 'akiva',
  [HEBREW_CATALOG_GENRES.hananBenAri]: 'hanan-ben-ari',
  [HEBREW_CATALOG_GENRES.aharonRazel]: 'aharon-razel',
  [HEBREW_CATALOG_GENRES.eviatarBanai]: 'eviatar-banai',
  [HEBREW_CATALOG_GENRES.shuliRand]: 'shuli-rand',
  [HEBREW_CATALOG_GENRES.carlebach]: 'carlebach',
  [HEBREW_CATALOG_GENRES.neginaJewish]: 'negina-jewish-music',
  [HEBREW_CATALOG_GENRES.tab4uHassidic]: 'tab4u-hassidic-full',
}

const VALID_CATEGORIES = new Set<HebrewClassifierCategory>([
  'chabad',
  'hassidic',
  'classic_israeli',
  'modern',
  'ribo',
  'karduner',
  'akiva',
  'hanan_ben_ari',
  'aharon_razel',
  'eviatar_banai',
  'shuli_rand',
  'carlebach',
  'unclassified',
])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function textIncludesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(normalizeMatchText(n)))
}

/** Cheap pre-AI heuristics for obvious artists / Habad markers. */
export function classifyHebrewSongHeuristic(
  song: HebrewSongToClassify
): HebrewSongClassification | null {
  const blob = normalizeMatchText(`${song.title} ${song.author}`)

  if (
    textIncludesAny(blob, [
      'חב"ד',
      'חב״ד',
      'חבד',
      'chabad',
      'lubavitch',
      'ליובאוויטש',
      'חב ד',
    ])
  ) {
    return {
      id: song.id,
      category: 'chabad',
      decade: null,
      confidence: 0.95,
      reason: 'Habad / Lubavitch marker in title or author',
      source: 'heuristic',
    }
  }

  if (
    textIncludesAny(blob, ['ישי ריבו', 'ishay ribo']) ||
    /\bribo\b/i.test(`${song.title} ${song.author}`)
  ) {
    return {
      id: song.id,
      category: 'ribo',
      decade: 2010,
      confidence: 0.92,
      reason: 'Ishay Ribo artist match',
      source: 'heuristic',
    }
  }

  if (
    textIncludesAny(blob, [
      'יוסף קארדונר',
      'יוסף קרדונר',
      'קארדונר',
      'קרדונר',
      'karduner',
      'yosef karduner',
    ])
  ) {
    return {
      id: song.id,
      category: 'karduner',
      decade: 2000,
      confidence: 0.92,
      reason: 'Yosef Karduner artist match',
      source: 'heuristic',
    }
  }

  {
    // Modern artist "Akiva" only — exclude Akiva Turgeman, Rabbi Akiva, Bnei Akiva
    const author = normalizeMatchText(song.author)
    const isOtherAkiva = textIncludesAny(author, [
      'תורג',
      'turgeman',
      'בן עקיבא',
      'רבי עקיבא',
      'bnei akiva',
    ])
    if (!isOtherAkiva) {
      const authorIsAkivaAlone =
        author === 'עקיבא' ||
        author === 'akiva' ||
        /^akiva\b/i.test(song.author.trim()) ||
        /^עקיבא\s*$/.test(song.author.trim())
      if (authorIsAkivaAlone) {
        return {
          id: song.id,
          category: 'akiva',
          decade: 2020,
          confidence: 0.9,
          reason: 'Akiva artist match',
          source: 'heuristic',
        }
      }
    }
  }

  if (
    textIncludesAny(blob, [
      'קרליבך',
      'קרלבך',
      'carlebach',
      'shlomo carlebach',
      'שלמה קרליבך',
    ])
  ) {
    return {
      id: song.id,
      category: 'carlebach',
      decade: 1970,
      confidence: 0.92,
      reason: 'Carlebach artist match',
      source: 'heuristic',
    }
  }

  if (textIncludesAny(blob, ['חנן בן ארי', 'hanan ben ari'])) {
    return {
      id: song.id,
      category: 'hanan_ben_ari',
      decade: 2010,
      confidence: 0.92,
      reason: 'Hanan Ben Ari artist match',
      source: 'heuristic',
    }
  }

  if (textIncludesAny(blob, ['אהרן רזאל', 'אהרון רזאל', 'aharon razel'])) {
    return {
      id: song.id,
      category: 'aharon_razel',
      decade: 2000,
      confidence: 0.92,
      reason: 'Aharon Razel artist match',
      source: 'heuristic',
    }
  }

  if (textIncludesAny(blob, ['אביתר בנאי', 'eviatar banai', 'eviator banai'])) {
    return {
      id: song.id,
      category: 'eviatar_banai',
      decade: 2000,
      confidence: 0.92,
      reason: 'Eviatar Banai artist match',
      source: 'heuristic',
    }
  }

  if (textIncludesAny(blob, ['שולי רנד', 'shuli rand'])) {
    return {
      id: song.id,
      category: 'shuli_rand',
      decade: 2000,
      confidence: 0.92,
      reason: 'Shuli Rand artist match',
      source: 'heuristic',
    }
  }

  // Known modern Israeli / Jewish-Israeli artists (not dump residue)
  if (
    textIncludesAny(blob, [
      'יונתן רזאל',
      'yonatan razel',
      'עומר אדם',
      'omer adam',
      'שלומי שבת',
      'shlomi shabat',
      'עקיבא תורג',
      'akiva turgeman',
      'יאיר אליצור',
      'יאיר אלייצור',
      'יובל דיין',
      'בני פרידמן',
      'benny friedman',
      'יעקב שוואקי',
      'yaakov shwekey',
      'שוואקי',
      'עמיר בניון',
      'דודי אהרון',
      'דודו אהרון',
      'זאנוויל',
      'אברהם פריד', // often hasidic-pop; still often shelved modern-religious — prefer hassidic below
    ])
  ) {
    // Known Hasidic performers that appear in the modern-artist list above
    if (
      textIncludesAny(blob, [
        'אברהם פריד',
        'avraham fried',
        'זאנוויל',
        'weinberger',
        'בני פרידמן',
        'benny friedman',
        'יעקב שוואקי',
        'yaakov shwekey',
        'שוואקי',
      ])
    ) {
      return {
        id: song.id,
        category: 'hassidic',
        decade: 2000,
        confidence: 0.85,
        reason: 'Known hassidic artist',
        source: 'heuristic',
      }
    }
    return {
      id: song.id,
      category: 'modern',
      decade: 2010,
      confidence: 0.88,
      reason: 'Known modern Israeli artist',
      source: 'heuristic',
    }
  }

  // Classic Israeli markers
  if (
    textIncludesAny(blob, [
      'אריק איינשטיין',
      'arik einstein',
      'נעמי שמר',
      'naomi shemer',
      'חוה אלברשטיין',
      'עפרה חזה',
      'ofra haza',
      'שיקה פייקוב',
      'יורם טהרלב',
      'נעמי שמר',
    ])
  ) {
    return {
      id: song.id,
      category: 'classic_israeli',
      decade: 1970,
      confidence: 0.9,
      reason: 'Classic Israeli artist',
      source: 'heuristic',
    }
  }

  return null
}

export function categoryToCatalogGenre(
  category: HebrewClassifierCategory,
  fallbackDumpGenre: HebrewCatalogGenre = HEBREW_CATALOG_GENRES.neginaJewish
): HebrewCatalogGenre {
  if (category === 'unclassified') return fallbackDumpGenre
  return CATEGORY_TO_GENRE[category]
}

export function shouldApplyClassification(
  classification: HebrewSongClassification,
  options?: { aggressive?: boolean; threshold?: number }
): boolean {
  if (classification.category === 'unclassified') return false
  const threshold =
    options?.threshold ??
    (options?.aggressive
      ? CLASSIFY_AGGRESSIVE_CONFIDENCE_THRESHOLD
      : CLASSIFY_CONFIDENCE_THRESHOLD)
  return classification.confidence >= threshold
}

/** After AI: in aggressive mode, force leftover unclassified → hassidic. */
export function applyAggressiveHassidicDefault(
  classification: HebrewSongClassification
): HebrewSongClassification {
  if (classification.category !== 'unclassified') return classification
  return {
    ...classification,
    category: 'hassidic',
    confidence: Math.max(classification.confidence, 0.65),
    reason: `${classification.reason} → aggressive default hassidic (Tab4U residue)`,
  }
}

function normalizeDecade(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const decade = Math.floor(value / 10) * 10
  return VALID_DECADES.has(decade) ? decade : null
}

function parseClassificationBatch(
  raw: string,
  songs: HebrewSongToClassify[]
): HebrewSongClassification[] {
  const byId = new Map(songs.map((s) => [s.id, s]))
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return songs.map((s) => ({
      id: s.id,
      category: 'unclassified' as const,
      decade: null,
      confidence: 0,
      reason: 'invalid JSON from AI',
      source: 'ai' as const,
    }))
  }

  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { songs?: unknown })?.songs)
      ? (parsed as { songs: unknown[] }).songs
      : Array.isArray((parsed as { results?: unknown })?.results)
        ? (parsed as { results: unknown[] }).results
        : null

  if (!items) {
    return songs.map((s) => ({
      id: s.id,
      category: 'unclassified' as const,
      decade: null,
      confidence: 0,
      reason: 'AI response missing songs array',
      source: 'ai' as const,
    }))
  }

  const out: HebrewSongClassification[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id : ''
    if (!id || !byId.has(id) || seen.has(id)) continue
    seen.add(id)

    const categoryRaw = String(row.category ?? 'unclassified')
      .toLowerCase()
      .replace(/-/g, '_') as HebrewClassifierCategory
    const category = VALID_CATEGORIES.has(categoryRaw)
      ? categoryRaw
      : 'unclassified'
    const confidenceRaw =
      typeof row.confidence === 'number' ? row.confidence : Number(row.confidence)
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0

    out.push({
      id,
      category,
      decade: normalizeDecade(row.decade),
      confidence,
      reason:
        typeof row.reason === 'string' && row.reason.trim()
          ? row.reason.trim().slice(0, 200)
          : 'ai',
      source: 'ai',
    })
  }

  for (const song of songs) {
    if (!seen.has(song.id)) {
      out.push({
        id: song.id,
        category: 'unclassified',
        decade: null,
        confidence: 0,
        reason: 'missing from AI batch response',
        source: 'ai',
      })
    }
  }

  return out
}

const SYSTEM_PROMPT = `You are an expert in Israeli and Jewish music taxonomy for a guitar-tabs catalog.
Classify each song into exactly one category. Respond with JSON only.
Use ONLY the given title+author. Never invent that an artist is someone else.

Categories (priority order — pick the first that clearly fits):
1. chabad — Chabad/Lubavitch nigunim ONLY when Habad/Lubavitch is explicit
2. hassidic — Hasidic / חסידי that is NOT Chabad (Avraham Fried, Zanvil Weinberger, Modzitz, Breslov, Benny Friedman, Yaakov Shwekey, generic nigunim)
3. classic_israeli — שירי ארץ ישראל / pre-2000 Israeli pop-folk (Arik Einstein, Naomi Shemer, Chava Alberstein, Ofra Haza, old army/folk). Decade usually < 2000.
4. modern — Israeli / Jewish-Israeli ~2000+ that is NOT hasidic/chabad and NOT a named artist below.
   Examples that MUST be modern: Yonatan Razel, Shlomi Shabat, Omer Adam, Yuval Dayan, Akiva Turgeman, Amir Benayoun, Dudu Aharon.
5. ribo — ONLY if author is clearly Ishay Ribo / ישי ריבו
6. karduner — ONLY if author is clearly Yosef Karduner / יוסף קארדונר
7. akiva — ONLY the solo artist named exactly Akiva / עקיבא (NOT Akiva Turgeman, NOT Rabbi Akiva)
8. hanan_ben_ari — ONLY Hanan Ben Ari / חנן בן ארי
9. aharon_razel — ONLY Aharon Razel / אהרן רזאל (NOT Yonatan Razel)
10. eviatar_banai — ONLY Eviatar Banai / אביתר בנאי
11. shuli_rand — ONLY Shuli Rand / שולי רנד
12. carlebach — ONLY Shlomo Carlebach / קרליבך
13. unclassified — not enough signal

Hard rules:
- NEVER tag ribo/karduner/akiva/hanan_ben_ari/aharon_razel/eviatar_banai/shuli_rand/carlebach unless that exact artist appears in author/title.
- Yonatan Razel → modern (never ribo, never aharon_razel).
- Aharon Razel → aharon_razel (never ribo).
- Hanan Ben Ari → hanan_ben_ari (never modern).
- Akiva Turgeman → modern (never akiva).
- Prefer chabad over hassidic only when Habad/Lubavitch is clear.
- Prefer classic_israeli over modern when decade < 2000 OR classic Israeli style.
- decade must be one of 1960,1970,1980,1990,2000,2010,2020 or null.
- confidence 0-1; if unsure use unclassified with confidence < 0.55.

Return JSON object: { "songs": [ { "id", "category", "decade", "confidence", "reason" } ] }
Include every input id exactly once.`

const AGGRESSIVE_SYSTEM_PROMPT = `You are an expert in Israeli and Jewish music taxonomy.
These songs come from Tab4U category "שירים חסידיים" (Hasidic songs dump). Respond with JSON only.
Use ONLY the given title+author. Never invent that an artist is someone else.

Categories (priority order):
1. chabad — ONLY when Habad/Lubavitch is explicit
2. ribo — ONLY Ishay Ribo / ישי ריבו
3. karduner — ONLY Yosef Karduner
4. akiva — ONLY solo artist Akiva / עקיבא (NOT Akiva Turgeman)
5. hanan_ben_ari — ONLY Hanan Ben Ari / חנן בן ארי
6. aharon_razel — ONLY Aharon Razel / אהרן רזאל
7. eviatar_banai — ONLY Eviatar Banai / אביתר בנאי
8. shuli_rand — ONLY Shuli Rand / שולי רנד
9. carlebach — ONLY Shlomo Carlebach
10. classic_israeli — clear pre-2000 שירי ארץ ישראל classics
11. modern — clear modern Israeli non-hasidic (Yonatan Razel, Omer Adam, Akiva Turgeman, etc.)
12. hassidic — DEFAULT for this dump: nigunim, Hasidic performers, Yiddish liturgical, Breslov, Shwekey, Fried, Beri Weber, Motty Steinmetz, Miami Boys Choir, army rabbinate choirs doing liturgical, unknown religious artists

Hard rules:
- Prefer hassidic over unclassified. Almost never use unclassified.
- NEVER tag ribo/karduner/akiva/hanan_ben_ari/aharon_razel/eviatar_banai/shuli_rand/carlebach unless that exact artist appears.
- decade: 1960|1970|1980|1990|2000|2010|2020 or null.
- confidence 0-1; for hassidic default use >= 0.6 when uncertain but still hasidic-flavored.

Return JSON: { "songs": [ { "id", "category", "decade", "confidence", "reason" } ] }
Include every input id exactly once.`

async function classifyBatchWithAI(
  songs: HebrewSongToClassify[],
  options?: { aggressive?: boolean }
): Promise<HebrewSongClassification[]> {
  if (!isAIAvailable()) {
    return songs.map((s) => ({
      id: s.id,
      category: 'unclassified' as const,
      decade: null,
      confidence: 0,
      reason: 'OpenAI API key not configured',
      source: 'ai' as const,
    }))
  }

  const userPayload = {
    songs: songs.map((s) => ({
      id: s.id,
      title: s.title,
      author: s.author,
    })),
  }

  const systemPrompt = options?.aggressive
    ? AGGRESSIVE_SYSTEM_PROMPT
    : SYSTEM_PROMPT

  const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Classify these songs:\n${JSON.stringify(userPayload)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    return songs.map((s) => ({
      id: s.id,
      category: 'unclassified' as const,
      decade: null,
      confidence: 0,
      reason: `AI HTTP ${response.status}${errText ? `: ${errText.slice(0, 80)}` : ''}`,
      source: 'ai' as const,
    }))
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return songs.map((s) => ({
      id: s.id,
      category: 'unclassified' as const,
      decade: null,
      confidence: 0,
      reason: 'empty AI content',
      source: 'ai' as const,
    }))
  }

  return parseClassificationBatch(content, songs)
}

/**
 * Classify songs: heuristics first, then AI batches for the rest.
 */
export async function classifyHebrewSongs(
  songs: HebrewSongToClassify[],
  options?: ClassifyHebrewSongsOptions
): Promise<HebrewSongClassification[]> {
  const results: HebrewSongClassification[] = []
  const needsAi: HebrewSongToClassify[] = []

  for (const song of songs) {
    const heuristic = classifyHebrewSongHeuristic(song)
    if (heuristic) {
      results.push(heuristic)
      options?.onBatch?.([heuristic])
    } else {
      needsAi.push(song)
    }
  }

  for (let i = 0; i < needsAi.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = needsAi.slice(i, i + CLASSIFY_BATCH_SIZE)
    let batchResults = await classifyBatchWithAI(batch, {
      aggressive: options?.aggressive,
    })
    if (options?.aggressive) {
      batchResults = batchResults.map(applyAggressiveHassidicDefault)
    }
    results.push(...batchResults)
    options?.onBatch?.(batchResults)
    if (i + CLASSIFY_BATCH_SIZE < needsAi.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return results
}

export async function classifyAndResolveGenre(
  song: HebrewSongToClassify,
  fallbackDumpGenre: HebrewCatalogGenre = HEBREW_CATALOG_GENRES.neginaJewish
): Promise<{
  classification: HebrewSongClassification
  genre: HebrewCatalogGenre
  decade: number | null
  applied: boolean
}> {
  const [classification] = await classifyHebrewSongs([song])
  const applied = shouldApplyClassification(classification)
  return {
    classification,
    genre: applied
      ? categoryToCatalogGenre(classification.category, fallbackDumpGenre)
      : fallbackDumpGenre,
    decade: classification.decade,
    applied,
  }
}
