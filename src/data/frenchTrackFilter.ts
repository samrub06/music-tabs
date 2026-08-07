/**
 * Keep France chart / FR editorial shelves francophone-only.
 * Spotify France daily charts mix in global Latin/US hits (Bad Bunny, etc.).
 */

import { FRENCH_PLAYLISTS } from '@/data/frenchPlaylists'
import { GENRE_TRIAGE_AUTHOR_RULES } from '@/data/genreTriageHeuristics'

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Global / Latin / US chart invaders that must never land in FR guitar shelves. */
export const NON_FRENCH_ARTIST_BLOCKLIST = [
  'bad bunny',
  'drake',
  'taylor swift',
  'the weeknd',
  'weeknd',
  'travis scott',
  'kendrick lamar',
  'sza',
  'metro boomin',
  'future',
  'ariana grande',
  'billie eilish',
  'olivia rodrigo',
  'post malone',
  'eminem',
  'karol g',
  'peso pluma',
  'feid',
  'shakira',
  'rihanna',
  'beyonce',
  'beyoncé',
  'coldplay',
  'ed sheeran',
  'dua lipa',
  'harry styles',
  'bruno mars',
  'the neighbourhood',
  'tate mcrae',
  'sabrina carpenter',
  'doja cat',
  'lil nas x',
  'justin bieber',
  'selena gomez',
  'lady gaga',
  'kanye',
  'ye ',
  'morgan wallen',
  'teddy swims',
  'rosalia',
  'rosalía',
  'j balvin',
  'maluma',
  'ozuna',
  'anuel',
  'daddy yankee',
  'myke towers',
  'quevedo',
  'rauw alejandro',
  'arcangel',
  'eladio carrion',
  'badgyal',
]

/** Explicit francophone artists (performers) for allow-matching. */
const EXTRA_FRENCH_ARTISTS = [
  'kendji',
  'kendji girac',
  'patrick bruel',
  'bruel',
  'jean-jacques goldman',
  'jean jacques goldman',
  'jj goldman',
  'goldman',
  'celine dion',
  'céline dion',
  'celine',
  'vianney',
  'enrico macias',
  'macias',
  'gims',
  'maitre gims',
  'maître gims',
  'slimane',
  'vitaa',
  'louane',
  'jenifer',
  'amandine',
  'clara luciani',
  'pomme',
  'juliette armand',
  'suzane',
  'black m',
  'sexion',
  'tryo',
  'mika',
  'zaz',
  'joyce jonathan',
  'christophe mae',
  'christophe maé',
  'michel sardou',
  'pascal obispo',
  'florent pagny',
  'pagny',
  'garou',
  'helene segara',
  'hélène segara',
  'lara fabian',
  'patricia kaas',
  'alain bashung',
  'bashung',
  'daniel balavoine',
  'balavoine',
  'michel berger',
  'france gall',
  'joe dassin',
  'dalida',
  'claude nougaro',
  'michel polnareff',
  'polnareff',
  'julien clerc',
  'francis cabrel',
  'cabrel',
  'renaud',
  'brel',
  'aznavour',
  'brassens',
  'piaf',
  'stromae',
  'angele',
  'angèle',
  'calogero',
  'indochine',
  'telephone',
  'téléphone',
  'johnny hallyday',
  'hallyday',
  'mylene farmer',
  'mylène farmer',
  'souchon',
  'voulzy',
  'sardou',
  'gainsbourg',
  'zazie',
  'orelsan',
  'orel san',
  'nekfeu',
  'pnl',
  'damso',
  'booba',
  'bigflo',
  'jul',
  'ninho',
  'niska',
  'lomepal',
  'vald',
  'soprano',
  'mc solaar',
  'iam',
  'ntm',
  'kery james',
  'youssoupha',
  'disiz',
  'sch',
  'gazo',
  'tiakola',
  'plk',
  'josman',
  'alpha wann',
  'laylow',
  'kaaris',
  'freeze corleone',
  'heuss',
  'romeo elvis',
  'roméo elvis',
  'lorenzo',
  'kekra',
  'werenoi',
  'vitaa',
  'm pokora',
  'mpokora',
  'm. pokora',
  'tal',
  'shym',
  'keen v',
  'keenv',
  'pierre de maere',
  'santa',
  'pierre garnier',
  'helena',
  'mentissa',
  'sdm',
  'naps',
  'vianney bureau',
]

function collectAllowlist(): string[] {
  const fromPlaylists = FRENCH_PLAYLISTS.flatMap((p) => p.artistAuthors)
  const fromHeuristics = GENRE_TRIAGE_AUTHOR_RULES.flatMap((h) =>
    h.genre === 'french-variete' || h.genre === 'french-rap' ? h.authors : []
  )
  return Array.from(
    new Set(
      [...fromPlaylists, ...fromHeuristics, ...EXTRA_FRENCH_ARTISTS].map(normalize)
    )
  ).filter(Boolean)
}

let cachedAllow: string[] | null = null
function allowlist(): string[] {
  if (!cachedAllow) cachedAllow = collectAllowlist()
  return cachedAllow
}

const FRENCH_TITLE_HINT =
  /\b(je|tu|il|elle|nous|vous|les|des|une|aux|pour|dans|avec|sans|plus|jamais|amour|coeur|cœur|vie|nuit|jour|soleil|pluie|monde|enfant|maman|papa|france|paris|Bruxelles|Bruxelles)\b|[àâäéèêëïîôùûüçœæ]/i

function hasTokenOrPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false
  if (haystack === needle) return true
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Word-boundary style so "anuel" does not match inside "emmanuel".
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(haystack)
}

export function isBlockedNonFrenchArtist(artist: string): boolean {
  const a = normalize(artist)
  if (!a) return true
  return NON_FRENCH_ARTIST_BLOCKLIST.some((blocked) =>
    hasTokenOrPhrase(a, normalize(blocked))
  )
}

export function isLikelyFrenchArtist(artist: string): boolean {
  const a = normalize(artist)
  if (!a || isBlockedNonFrenchArtist(artist)) return false
  return allowlist().some((allowed) => hasTokenOrPhrase(a, normalize(allowed)))
}

/**
 * Keep only francophone tracks for FR shelves.
 * Prefer allowlisted artists; fall back to French-looking titles only if not blocklisted.
 */
export function isFrenchCatalogTrack(title: string, artist: string): boolean {
  if (isBlockedNonFrenchArtist(artist)) return false
  if (isLikelyFrenchArtist(artist)) return true
  // Soft fallback: French title cues + not an obvious global artist
  const t = title.trim()
  if (t.length >= 3 && FRENCH_TITLE_HINT.test(t)) return true
  return false
}

export function filterFrenchOnlyTracks<T extends { title: string; artist: string }>(
  tracks: T[]
): T[] {
  return tracks.filter((t) => isFrenchCatalogTrack(t.title, t.artist))
}
