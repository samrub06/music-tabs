import type { ChordPosition } from '@/types'

/** Build a monospace-padded chord line aligned to lyric character indices.
 *
 * When a chord's requested position would collide with already-written content
 * (e.g. multiple chords all at the end of a short lyric), the chord is pushed
 * one character past the current end so every chord remains parseable.
 */
export function buildSpacedChordLine(chords: ChordPosition[], lyrics: string): string {
  let chordLine = ''

  for (const chordPos of chords) {
    // If the requested position is inside already-written content, push this
    // chord to just after the current end (1-space gap) so it isn't lost.
    const insertAt =
      chordPos.position < chordLine.length ? chordLine.length + 1 : chordPos.position

    while (chordLine.length < insertAt) {
      chordLine += ' '
    }
    chordLine += chordPos.chord
  }

  while (chordLine.length < lyrics.length) {
    chordLine += ' '
  }

  return chordLine
}
