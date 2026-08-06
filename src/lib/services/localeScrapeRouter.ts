/**
 * Shared locale routing for tab search: Israeli/Hebrew → Tab4U then Negina; else UG.
 * Used by popular catalog seed and user Spotify/playlist import.
 */
import {
  searchNeginaOnly,
  searchTab4UOnly,
  searchUltimateGuitarOnly,
  type SearchResult,
} from '@/lib/services/scraperService'

export type TabLocale = 'il' | 'intl'

export type LocaleSearchSource = 'tab4u' | 'negina' | 'ultimate-guitar'

export type LocaleSearchHit = {
  locale: TabLocale
  source: LocaleSearchSource
  results: SearchResult[]
}

const HEBREW_SCRIPT = /[\u0590-\u05FF]/

/** Well-known Israeli / Hebrew artists (latin + common transliterations). */
const KNOWN_IL_ARTISTS = [
  'ishay ribo',
  'ישי ריבו',
  'ribo',
  'hanan ben ari',
  'חנן בן ארי',
  'aharon razel',
  'אהרן רזאל',
  'yonatan razel',
  'יונתן רזאל',
  'eviatar banai',
  'אביתר בנאי',
  'shuli rand',
  'שולי רנד',
  'omer adam',
  'עומר אדם',
  'shlomi shabat',
  'שלומי שבת',
  'eden ben zaken',
  'static and ben el',
  'סטטיק',
  'eyal golan',
  'אייל גולן',
  'moshe peretz',
  'משה פרץ',
  'yaakov shwekey',
  'שוואקי',
  'avraham fried',
  'אברהם פריד',
  'carlebach',
  'קרליבך',
  'akiva',
  'עקיבא',
  'karduner',
  'קארדונר',
  'idolf',
  'netta',
  'הדג נחש',
  'hadag nahash',
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Cheap locale classify: Hebrew script, known IL artists, or explicit market hint.
 * Does not call AI (keep import path fast/deterministic).
 */
export function classifyTrackLocale(
  title: string,
  artist: string,
  marketHint?: 'IL' | 'INTL'
): TabLocale {
  if (marketHint === 'IL') return 'il'
  if (marketHint === 'INTL') return 'intl'

  const blob = `${title} ${artist}`
  if (HEBREW_SCRIPT.test(blob)) return 'il'

  const norm = normalize(blob)
  if (KNOWN_IL_ARTISTS.some((a) => norm.includes(normalize(a)))) return 'il'

  return 'intl'
}

/**
 * Search tabs by locale: IL → Tab4U then Negina; INTL → Ultimate Guitar.
 */
export async function searchTabsByLocale(
  title: string,
  artist: string,
  options?: { marketHint?: 'IL' | 'INTL' }
): Promise<LocaleSearchHit> {
  const locale = classifyTrackLocale(title, artist, options?.marketHint)
  const query = `${artist} ${title}`.trim()

  if (locale === 'il') {
    const tab4u = await searchTab4UOnly(query)
    if (tab4u.length > 0) {
      return { locale, source: 'tab4u', results: tab4u }
    }
    const negina = await searchNeginaOnly(query)
    if (negina.length > 0) {
      return { locale, source: 'negina', results: negina }
    }
    // Last resort: UG may still have latin transliterations
    const ug = await searchUltimateGuitarOnly(query)
    return { locale, source: 'ultimate-guitar', results: ug }
  }

  const ug = await searchUltimateGuitarOnly(query)
  return { locale, source: 'ultimate-guitar', results: ug }
}
