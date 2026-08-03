export type ChordSectionPref = 'always_open' | 'always_collapsed' | 'auto'

export const CHORD_SECTION_PREF_KEY = 'tabasco:chord-section-pref'
export const CHORD_SECTION_OPEN_COUNT_KEY = 'tabasco:chord-section-open-count'
export const CHORD_SECTION_COLLAPSE_HINT_KEY = 'tabasco:chord-section-collapse-hint-seen'

/** After this many manual opens in `auto` mode, default to collapsed. */
export const CHORD_SECTION_AUTO_COLLAPSE_AFTER = 5

export function readChordSectionPref(): ChordSectionPref {
  try {
    const raw = localStorage.getItem(CHORD_SECTION_PREF_KEY)
    if (raw === 'always_open' || raw === 'always_collapsed' || raw === 'auto') return raw
  } catch {
    // ignore
  }
  return 'auto'
}

export function writeChordSectionPref(pref: ChordSectionPref): void {
  try {
    localStorage.setItem(CHORD_SECTION_PREF_KEY, pref)
  } catch {
    // ignore
  }
}

export function readChordSectionOpenCount(): number {
  try {
    const n = Number(localStorage.getItem(CHORD_SECTION_OPEN_COUNT_KEY) ?? '0')
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function incrementChordSectionOpenCount(): number {
  const next = readChordSectionOpenCount() + 1
  try {
    localStorage.setItem(CHORD_SECTION_OPEN_COUNT_KEY, String(next))
  } catch {
    // ignore
  }
  return next
}

export function shouldShowChordCollapseHint(): boolean {
  try {
    return localStorage.getItem(CHORD_SECTION_COLLAPSE_HINT_KEY) !== '1'
  } catch {
    return false
  }
}

export function markChordCollapseHintSeen(): void {
  try {
    localStorage.setItem(CHORD_SECTION_COLLAPSE_HINT_KEY, '1')
  } catch {
    // ignore
  }
}

/** Initial open state for the chord diagrams accordion. */
export function resolveInitialChordSectionOpen(): boolean {
  const pref = readChordSectionPref()
  if (pref === 'always_open') return true
  if (pref === 'always_collapsed') return false
  return readChordSectionOpenCount() < CHORD_SECTION_AUTO_COLLAPSE_AFTER
}
