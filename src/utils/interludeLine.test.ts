import { describe, expect, it } from 'vitest'
import type { SongLine } from '@/types'
import {
  INTERLUDE_PAUSE_SEC_PER_LINE,
  interludePauseMs,
  isInterludeLine,
} from '@/utils/interludeLine'

describe('isInterludeLine', () => {
  it('flags chords_only with multiple chords', () => {
    const line: SongLine = {
      type: 'chords_only',
      chord_line: 'Am  G  F  E',
    }
    expect(isInterludeLine(line)).toBe(true)
  })

  it('ignores sparse chords_only', () => {
    const line: SongLine = { type: 'chords_only', chord_line: 'Am' }
    expect(isInterludeLine(line)).toBe(false)
  })

  it('flags chord_over_lyrics with many chords and tiny lyric', () => {
    const line: SongLine = {
      type: 'chord_over_lyrics',
      lyrics: 'oh',
      chords: [
        { chord: 'C', position: 0 },
        { chord: 'G', position: 1 },
        { chord: 'Am', position: 2 },
        { chord: 'F', position: 3 },
      ],
    }
    expect(isInterludeLine(line)).toBe(true)
  })

  it('ignores normal lyric lines', () => {
    const line: SongLine = {
      type: 'chord_over_lyrics',
      lyrics: 'Yesterday all my troubles seemed so far away',
      chords: [
        { chord: 'F', position: 0 },
        { chord: 'Em', position: 10 },
      ],
    }
    expect(isInterludeLine(line)).toBe(false)
  })
})

describe('interludePauseMs', () => {
  it('uses 4s per line', () => {
    expect(interludePauseMs(1)).toBe(INTERLUDE_PAUSE_SEC_PER_LINE * 1000)
    expect(interludePauseMs(2)).toBe(2 * INTERLUDE_PAUSE_SEC_PER_LINE * 1000)
  })

  it('caps long streaks', () => {
    expect(interludePauseMs(10)).toBe(16_000)
  })
})
