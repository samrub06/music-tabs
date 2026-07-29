import { describe, expect, it } from 'vitest'
import {
  isPracticeTutorialLyricLine,
  pickPracticeTutorialLyricLines,
} from '@/utils/lyricSync'
import type { LyricSyncLine } from '@/types'

describe('isPracticeTutorialLyricLine', () => {
  it('accepts real sung lyrics', () => {
    expect(isPracticeTutorialLyricLine("J'avais pas prévu d'un jour adopter")).toBe(true)
    expect(isPracticeTutorialLyricLine("Mon enfant j'ai dû surtout m'adapter")).toBe(true)
  })

  it('rejects empty, pattern labels, and guitar tabs', () => {
    expect(isPracticeTutorialLyricLine('')).toBe(false)
    expect(isPracticeTutorialLyricLine('   ')).toBe(false)
    expect(isPracticeTutorialLyricLine('Main Pattern:')).toBe(false)
    expect(
      isPracticeTutorialLyricLine('D|---------------0--|------------------|--------')
    ).toBe(false)
    expect(
      isPracticeTutorialLyricLine('A|---0--------------|------------------|--------')
    ).toBe(false)
    expect(isPracticeTutorialLyricLine('e|-0-2-3-|')).toBe(false)
  })
})

describe('pickPracticeTutorialLyricLines', () => {
  it('keeps song order and skips tabs/patterns', () => {
    const lines: LyricSyncLine[] = [
      { sectionIndex: 0, lineIndex: 1, text: 'Main Pattern:', startSec: 43.66, endSec: 45 },
      {
        sectionIndex: 1,
        lineIndex: 3,
        text: 'D|---------------0--|------------------|--------',
        startSec: 127.5,
        endSec: 130,
      },
      {
        sectionIndex: 2,
        lineIndex: 0,
        text: "J'avais pas prévu d'un jour adopter",
        startSec: 14.96,
        endSec: 18.2,
      },
      {
        sectionIndex: 2,
        lineIndex: 1,
        text: "Mon enfant j'ai dû surtout m'adapter",
        startSec: 18.2,
        endSec: 23.1,
      },
      {
        sectionIndex: 2,
        lineIndex: 2,
        text: 'Y a pas que les gènes qui font les familles',
        startSec: null,
        endSec: null,
      },
    ]

    const picked = pickPracticeTutorialLyricLines(lines)
    expect(picked).toHaveLength(2)
    expect(picked[0].lineIndex).toBe(0)
    expect(picked[1].text).toContain('Mon enfant')
    expect(picked[Math.min(1, picked.length - 1)].sectionIndex).toBe(2)
    expect(picked[Math.min(1, picked.length - 1)].lineIndex).toBe(1)
  })
})
