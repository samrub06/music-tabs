import chordVariantsFr from '@/data/chordVariants';
import { normalizeChordNameForComparison, parseChord } from '@/utils/chords';
import type { ChordVariantGroup } from '@/types/chordVariants';

/** Song symbols that map to a variant group id (beyond exact `group.symbol`). */
const SYMBOL_ALIASES: Record<string, string> = {
  DSUS4: 'D4',
  'D/F': 'D/F#',
};

function lookupKey(symbol: string): string {
  return normalizeChordNameForComparison(symbol);
}

const groupBySymbol = new Map<string, ChordVariantGroup>();

for (const group of chordVariantsFr) {
  groupBySymbol.set(lookupKey(group.symbol), group);
}

for (const [alias, targetSymbol] of Object.entries(SYMBOL_ALIASES)) {
  const target = groupBySymbol.get(lookupKey(targetSymbol));
  if (target) {
    groupBySymbol.set(lookupKey(alias), target);
  }
}

/**
 * Resolve a song chord symbol (e.g. "Am", "G", "Dsus4") to the static variant
 * group used on the /chords page, if one exists.
 */
export function getChordVariantGroup(songChord: string): ChordVariantGroup | null {
  if (!songChord?.trim()) return null;

  const trimmed = songChord.trim();

  const direct = groupBySymbol.get(lookupKey(trimmed));
  if (direct) return direct;

  const parsed = parseChord(trimmed);
  if (!parsed) return null;

  const { root, quality } = parsed;

  if (!quality) {
    return groupBySymbol.get(lookupKey(root)) ?? null;
  }

  if (quality === 'm' || quality === 'min') {
    return groupBySymbol.get(lookupKey(`${root}m`)) ?? null;
  }

  return groupBySymbol.get(lookupKey(root + quality)) ?? null;
}

export function hasChordVariantDiagrams(songChord: string): boolean {
  return getChordVariantGroup(songChord) != null;
}
