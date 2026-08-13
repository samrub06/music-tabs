import type { SongLine } from '@/types'

/** Seconds of continuous-autoscroll pause per detected interlude line. */
export const INTERLUDE_PAUSE_SEC_PER_LINE = 4

/** Cap so a long instrumental block does not freeze forever. */
export const INTERLUDE_PAUSE_SEC_MAX = 16

/**
 * Chord-only / chord-heavy lines (intros, interludes, outros) need more
 * listening time than lyric lines during continuous autoscroll.
 */
export function isInterludeLine(line: SongLine): boolean {
  if (line.type === 'chords_only') {
    const fromPositions = line.chords?.length ?? 0
    const fromChordLine = (line.chord_line ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
    return Math.max(fromPositions, fromChordLine) >= 2
  }

  if (line.type === 'chord_over_lyrics') {
    const chords = line.chords?.length ?? 0
    const lyricLen = (line.lyrics ?? '').replace(/\s+/g, '').length
    // Many chords, almost no lyric text → treat as instrumental
    return chords >= 4 && lyricLen <= 6
  }

  return false
}

export function interludePauseMs(lineCount: number): number {
  if (lineCount <= 0) return 0
  const sec = Math.min(INTERLUDE_PAUSE_SEC_MAX, lineCount * INTERLUDE_PAUSE_SEC_PER_LINE)
  return sec * 1000
}

/**
 * Count consecutive `[data-interlude="1"]` rows intersecting the reading band
 * (upper-mid viewport). Used by continuous autoscroll to pause briefly.
 */
export function getViewportInterludeStreak(
  root: ParentNode = document,
  options?: { bandTop?: number; bandBottom?: number }
): { streak: number; key: string } | null {
  const bandTop = options?.bandTop ?? Math.round(window.innerHeight * 0.22)
  const bandBottom = options?.bandBottom ?? Math.round(window.innerHeight * 0.55)
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-interlude="1"]'))
  if (nodes.length === 0) return null

  let firstHit = -1
  for (let i = 0; i < nodes.length; i++) {
    const rect = nodes[i].getBoundingClientRect()
    if (rect.bottom < bandTop || rect.top > bandBottom) continue
    firstHit = i
    break
  }
  if (firstHit < 0) return null

  let streak = 0
  for (let i = firstHit; i < nodes.length; i++) {
    const rect = nodes[i].getBoundingClientRect()
    if (rect.top > bandBottom + 80) break
    if (rect.bottom < bandTop - 40) continue
    streak += 1
  }
  if (streak <= 0) return null

  const anchor = nodes[firstHit]
  const anchorKey =
    anchor.getAttribute('data-lyric-key') ||
    anchor.getAttribute('data-practice-line') ||
    String(firstHit)
  return { streak, key: `${anchorKey}:${streak}` }
}

/** @deprecated use getViewportInterludeStreak */
export function countViewportInterludeStreak(
  root: ParentNode = document,
  options?: { bandTop?: number; bandBottom?: number }
): number {
  return getViewportInterludeStreak(root, options)?.streak ?? 0
}
