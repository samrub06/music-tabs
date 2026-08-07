/**
 * Rules for curated playlist membership verification / seed guards.
 * Keeps Rap FR free of variété (Johnny Hallyday, etc.) and artist shelves artist-only.
 */

import { FRENCH_PLAYLISTS } from '@/data/frenchPlaylists'
import {
  isBlockedNonFrenchArtist,
  isFrenchCatalogTrack,
} from '@/data/frenchTrackFilter'

export type PlaylistMembershipRule =
  | { kind: 'authorAny'; authors: string[]; frenchOnly?: boolean }
  | { kind: 'authorOnly'; authors: string[]; frenchOnly?: boolean }
  /** Chart-style FR shelf: francophone filter only (no closed author allowlist). */
  | { kind: 'francophone' }

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function authorMatchesNeedle(author: string, needle: string): boolean {
  const a = normalize(author)
  const n = normalize(needle)
  if (!n) return false
  if (a === n) return true
  if (n.length <= 4) {
    const tokens = a.split(/[^a-z0-9]+/).filter(Boolean)
    return tokens.includes(n)
  }
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(a)
}

export function authorMatchesAny(author: string, needles: string[]): boolean {
  return needles.some((n) => authorMatchesNeedle(author, n))
}

/** Variété / classic FR — never belong in Rap FR. */
export const RAP_FR_BLOCK_AUTHORS = [
  'Johnny Hallyday',
  'Hallyday',
  'Goldman',
  'Jean-Jacques Goldman',
  'Patrick Bruel',
  'Bruel',
  'Cabrel',
  'Francis Cabrel',
  'Brel',
  'Aznavour',
  'Brassens',
  'Piaf',
  'Sardou',
  'Souchon',
  'Voulzy',
  'Renaud',
  'Celine Dion',
  'Céline Dion',
  'Edith Piaf',
  'Édith Piaf',
  'Joe Dassin',
  'Nino Ferrer',
  'Michel Sardou',
  'Daniel Balavoine',
  'Pascal Obispo',
  'Florent Pagny',
  'Indochine',
  'Téléphone',
  'Telephone',
  'Noir Desir',
  'Noir Désir',
  'Mylene Farmer',
  'Mylène Farmer',
  'Claude Francois',
  'Claude François',
  'Barbara',
  'Gainsbourg',
  'Ferré',
  'Ferrat',
  'Nougaro',
  'Polnareff',
  'Bashung',
  'Vianney',
  'Kendji',
  'Kendji Girac',
  'Calogero',
  'Zazie',
  'Zaz',
  'Louane',
  'Jenifer',
  'Angèle',
  'Angele',
  'Stromae',
  'Indila',
  'Serge Lama',
  'Yves Montand',
  'Pierre Perret',
  'Emmanuel Moire',
  'Emmanuel Moiré',
  'Carla Lazzari',
  'Christophe',
  'Michel Berger',
  'France Gall',
  'Dalida',
  'Julien Clerc',
  'Début de Soirée',
  'Debut de Soiree',
]

const varieteAuthors = () =>
  FRENCH_PLAYLISTS.find((p) => p.slug === 'variete-francaise')?.artistAuthors ??
  []
const rapAuthors = () =>
  FRENCH_PLAYLISTS.find((p) => p.slug === 'rap-fr')?.artistAuthors ?? []

export const CURATED_PLAYLIST_MEMBERSHIP_RULES: Record<
  string,
  PlaylistMembershipRule
> = {
  'rap-fr': {
    kind: 'authorAny',
    frenchOnly: true,
    authors: [...rapAuthors(), 'Gims', 'Maître Gims', 'Maitre Gims'],
  },
  'variete-francaise': {
    kind: 'authorAny',
    frenchOnly: true,
    authors: [...varieteAuthors()],
  },
  // Daily chart + guitar pad mix many francophone artists; closed allowlists
  // wrongly strip Okoumé / niche variété while frenchOnly already blocks Bad Bunny etc.
  'spotify-top-france': {
    kind: 'francophone',
  },
  'kendji-girac': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Kendji', 'Kendji Girac'],
  },
  'jean-jacques-goldman': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Goldman', 'Jean-Jacques Goldman', 'Jean Jacques Goldman'],
  },
  'patrick-bruel': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Bruel', 'Patrick Bruel'],
  },
  'celine-dion': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Celine Dion', 'Céline Dion', 'Celine', 'Céline'],
  },
  vianney: {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Vianney'],
  },
  'enrico-macias': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Enrico Macias', 'Macias'],
  },
  'francis-cabrel': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Francis Cabrel', 'Cabrel'],
  },
  'johnny-hallyday': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Johnny Hallyday', 'Hallyday'],
  },
  'charles-aznavour': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Charles Aznavour', 'Aznavour'],
  },
  'jacques-brel': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Jacques Brel', 'Brel'],
  },
  'michel-sardou': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Michel Sardou', 'Sardou'],
  },
  'pascal-obispo': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Pascal Obispo', 'Obispo'],
  },
  stromae: {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Stromae'],
  },
  'florent-pagny': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Florent Pagny', 'Pagny'],
  },
  angele: {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Angèle', 'Angele'],
  },
  indochine: {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Indochine'],
  },
  'mylene-farmer': {
    kind: 'authorOnly',
    frenchOnly: true,
    authors: ['Mylène Farmer', 'Mylene Farmer'],
  },
  'ishay-ribo': {
    kind: 'authorOnly',
    authors: ['Ishay Ribo', 'ישי ריבו', 'Ribo'],
  },
  'ben-zur': {
    kind: 'authorOnly',
    authors: ['Ben Zur', 'Ben Tzur', 'בן צור'],
  },
  'eyal-golan': {
    kind: 'authorOnly',
    authors: ['Eyal Golan', 'אייל גולן'],
  },
  'omer-adam': {
    kind: 'authorOnly',
    authors: ['Omer Adam', 'עומר אדם'],
  },
  'noa-kirel': {
    kind: 'authorOnly',
    authors: ['Noa Kirel', 'נועה קירל'],
  },
  'eden-hason': {
    kind: 'authorOnly',
    authors: ['Eden Hason', 'עדן חסון'],
  },
  'sarit-hadad': {
    kind: 'authorOnly',
    authors: ['Sarit Hadad', 'שרית חדד'],
  },
  'moshe-peretz': {
    kind: 'authorOnly',
    authors: ['Moshe Peretz', 'משה פרץ'],
  },
  'nathan-goshen': {
    kind: 'authorOnly',
    authors: ['Nathan Goshen', 'נתן גושן'],
  },
  'idan-raichel': {
    kind: 'authorOnly',
    authors: ['Idan Raichel', 'עידן רייכל', 'Raichel'],
  },
  'shlomo-artzi': {
    kind: 'authorOnly',
    authors: ['Shlomo Artzi', 'שלמה ארצי'],
  },
  'static-ben-el': {
    kind: 'authorOnly',
    authors: ['Static', 'Ben El', 'סטטיק', 'בן אל'],
  },
  'itay-levi': {
    kind: 'authorOnly',
    authors: ['Itay Levi', 'איתי לוי'],
  },
  'osher-cohen': {
    kind: 'authorOnly',
    authors: ['Osher Cohen', 'אושר כהן'],
  },
}

export function songAllowedInCuratedPlaylist(
  slug: string,
  title: string,
  author: string,
  rule: PlaylistMembershipRule = CURATED_PLAYLIST_MEMBERSHIP_RULES[slug]!
): { ok: boolean; reason?: string } {
  if (!rule) return { ok: true }

  if (rule.kind === 'francophone') {
    if (!isFrenchCatalogTrack(title, author)) {
      return { ok: false, reason: 'not francophone (blocklist / filter)' }
    }
    return { ok: true }
  }

  if (rule.frenchOnly && isBlockedNonFrenchArtist(author)) {
    return { ok: false, reason: 'blocked non-francophone artist' }
  }

  if (slug === 'rap-fr' && authorMatchesAny(author, RAP_FR_BLOCK_AUTHORS)) {
    return { ok: false, reason: 'variété/classic artist not allowed in rap-fr' }
  }

  if (slug === 'celine-dion') {
    const t = normalize(title)
    const englishHits = [
      'my heart will go on',
      'the power of love',
      'all by myself',
      'because you loved me',
      'its all coming back',
      "it's all coming back",
      'think twice',
      'im alive',
      "i'm alive",
      'a new day has come',
      "that's the way it is",
      'that s the way it is',
    ]
    if (englishHits.some((h) => t.includes(h))) {
      return { ok: false, reason: 'English Céline hit' }
    }
  }

  if (rule.kind === 'authorOnly' || rule.kind === 'authorAny') {
    if (!authorMatchesAny(author, rule.authors)) {
      return {
        ok: false,
        reason:
          rule.kind === 'authorOnly'
            ? 'author does not match artist shelf'
            : 'author not in shelf allowlist',
      }
    }
  }

  return { ok: true }
}

/** Pre-scrape guard for popular seed research rows. */
export function researchedTrackAllowedForSource(
  targetSlug: string,
  title: string,
  artist: string
): boolean {
  const rule = CURATED_PLAYLIST_MEMBERSHIP_RULES[targetSlug]
  if (!rule) return true
  return songAllowedInCuratedPlaylist(targetSlug, title, artist, rule).ok
}
