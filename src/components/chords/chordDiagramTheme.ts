import type { ChordBoxOptions } from 'vexchords'

const LIGHT_COLOR = '#444'
const DARK_COLOR = '#d4d4d8'

export function isDocumentDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/** Merge chord box options with a theme-aware stroke/fill color. */
export function withChordDiagramTheme(
  options: ChordBoxOptions = {}
): ChordBoxOptions {
  return {
    ...options,
    defaultColor: isDocumentDarkMode() ? DARK_COLOR : LIGHT_COLOR,
  }
}
