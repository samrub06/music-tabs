import type { SongLine } from '@/types'

const REPEAT_START = /^(\d+)x\s*\[?\s*$/i
const REPEAT_END = /^\]\s*$/

export type DisplayLineGroup =
  | { kind: 'lines'; lines: SongLine[]; startIndex: number }
  | { kind: 'repeat'; repeatCount: number; lines: SongLine[]; startIndex: number }

/** Group section lines into normal lines and repeat blocks (e.g. `2x [` … `]`). */
export function groupLinesForDisplay(lines: SongLine[]): DisplayLineGroup[] {
  const groups: DisplayLineGroup[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const lyrics = line.lyrics?.trim() ?? ''

    if (line.type === 'lyrics_only' && REPEAT_START.test(lyrics)) {
      const repeatCount = parseInt(lyrics.match(REPEAT_START)?.[1] ?? '2', 10)
      const repeatLines: SongLine[] = []
      const startIndex = i
      i++

      while (i < lines.length) {
        const current = lines[i]
        const currentLyrics = current.lyrics?.trim() ?? ''

        if (current.type === 'lyrics_only' && REPEAT_END.test(currentLyrics)) {
          i++
          break
        }
        if (current.type === 'lyrics_only' && REPEAT_START.test(currentLyrics)) {
          break
        }

        repeatLines.push(current)
        i++
      }

      groups.push({ kind: 'repeat', repeatCount, lines: repeatLines, startIndex })
      continue
    }

    if (line.type === 'lyrics_only' && REPEAT_END.test(lyrics)) {
      i++
      continue
    }

    groups.push({ kind: 'lines', lines: [line], startIndex: i })
    i++
  }

  return groups
}
