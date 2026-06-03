import { normalizeChordNameForComparison, parseChord } from '@/utils/chords';

/** Filenames in `public/piano-chords/` (without .svg). */
export const PIANO_CHORD_ASSET_KEYS = [
  'A',
  'A7',
  'C',
  'D',
  'DM',
  'E',
  'Em',
  'G',
  'Gm',
] as const;

export type PianoChordAssetKey = (typeof PIANO_CHORD_ASSET_KEYS)[number];

const PIANO_ASSET_SET = new Set<string>(PIANO_CHORD_ASSET_KEYS);

const DB_NAME_TO_PIANO_KEY: Record<string, PianoChordAssetKey> = {
  'G MAJOR': 'G',
  'C MAJOR': 'C',
  'D MAJOR': 'D',
  'E MAJOR': 'E',
  'A MAJOR': 'A',
  'A MINOR': 'A',
  'E MINOR': 'Em',
  'D MINOR': 'DM',
  'G MINOR': 'Gm',
};

/**
 * Map a song or DB chord label to a piano SVG asset key, if available.
 */
export function getPianoChordAssetKey(chord: string): PianoChordAssetKey | null {
  if (!chord?.trim()) return null;

  const trimmed = chord.trim();
  const dbKey = normalizeChordNameForComparison(trimmed);
  const fromDb = DB_NAME_TO_PIANO_KEY[dbKey];
  if (fromDb) return fromDb;

  const parsed = parseChord(trimmed);
  if (!parsed) return null;

  const { root, quality } = parsed;
  let symbol = root;
  if (quality === 'm' || quality === 'min') {
    symbol += 'm';
  } else if (quality) {
    symbol += quality;
  }

  const normalized = normalizeChordNameForComparison(symbol);
  const candidates = [
    symbol,
    normalized,
    normalized === 'DM' || symbol.toUpperCase() === 'DM' ? 'DM' : null,
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (PIANO_ASSET_SET.has(c)) {
      return c as PianoChordAssetKey;
    }
  }

  return null;
}

export function getPianoChordSvgUrl(chord: string): string | null {
  const key = getPianoChordAssetKey(chord);
  if (!key) return null;
  return `/piano-chords/${key}.svg`;
}

export function hasPianoChordDiagram(chord: string): boolean {
  return getPianoChordSvgUrl(chord) != null;
}
