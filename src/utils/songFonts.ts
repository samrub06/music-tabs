/** Monospace stack for chord lines and Latin tab content. */
export const SONG_MONO_FONT =
  'Monaco, "Lucida Console", "Courier New", monospace'

/** Proportional stack for Hebrew lyrics in song viewer. */
export const SONG_HEBREW_LYRICS_FONT =
  'var(--font-heebo), "Heebo", "Segoe UI", "Noto Sans Hebrew", system-ui, sans-serif'

export function getSongLyricsFontFamily(isHebrew: boolean): string {
  return isHebrew ? SONG_HEBREW_LYRICS_FONT : SONG_MONO_FONT
}

export function getSongChordFontFamily(): string {
  return SONG_MONO_FONT
}

export function usesProportionalChordAlignment(isHebrew: boolean): boolean {
  return isHebrew
}
