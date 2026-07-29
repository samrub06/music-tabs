import type { SongSection } from '@/types'
import type { LyricSyncLine } from '@/types'

/** Extract seekable lyric lines from structured song sections. */
export function extractLyricLinesFromSections(sections: SongSection[]): LyricSyncLine[] {
  const lines: LyricSyncLine[] = []
  sections.forEach((section, sectionIndex) => {
    section.lines.forEach((line, lineIndex) => {
      if (line.type === 'chords_only') return
      const text = (line.lyrics ?? '').trim()
      if (!text) return
      lines.push({
        sectionIndex,
        lineIndex,
        text,
        startSec: null,
        endSec: null,
      })
    })
  })
  return lines
}

export function buildLyricSyncLookup(
  lines: LyricSyncLine[]
): Map<string, LyricSyncLine> {
  const map = new Map<string, LyricSyncLine>()
  for (const line of lines) {
    if (line.startSec == null) continue
    map.set(`${line.sectionIndex}:${line.lineIndex}`, line)
  }
  return map
}

/**
 * True for real sung lyrics — rejects empty, pattern labels, and guitar-tab ascii
 * that sometimes get timed in song_lyric_syncs.
 */
export function isPracticeTutorialLyricLine(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^main\s+pattern\b/i.test(t)) return false
  // Standard tab rows: E|--- or e|-0-2-
  if (/^[EADGBEeadgbe]\|/.test(t)) return false
  // Ascii tab with multiple pipes and fret/dash runs
  const pipeCount = (t.match(/\|/g) ?? []).length
  if (pipeCount >= 2 && /\|[-0-9xXhHpPbB=~./\\]+/.test(t)) return false
  return true
}

/** Timed sync rows that are actual lyric lines (song order preserved). */
export function pickPracticeTutorialLyricLines(lines: LyricSyncLine[]): LyricSyncLine[] {
  return lines.filter(
    (line) => line.startSec != null && isPracticeTutorialLyricLine(line.text ?? '')
  )
}
