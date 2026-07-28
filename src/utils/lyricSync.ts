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
