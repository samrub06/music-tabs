import { describe, expect, it } from 'vitest'
import {
  classifyHebrewSongHeuristic,
  categoryToCatalogGenre,
  shouldApplyClassification,
} from '@/lib/services/hebrewSongClassifierService'
import { HEBREW_CATALOG_GENRES } from '@/data/hebrewCatalogGenres'

describe('classifyHebrewSongHeuristic', () => {
  it('detects Chabad markers', () => {
    const result = classifyHebrewSongHeuristic({
      id: '1',
      title: 'ניגון חב״ד',
      author: 'Unknown',
    })
    expect(result?.category).toBe('chabad')
    expect(shouldApplyClassification(result!)).toBe(true)
  })

  it('treats Akiva Turgeman as modern, not akiva artist bucket', () => {
    const result = classifyHebrewSongHeuristic({
      id: '1b',
      title: 'ניגון ברדיצב',
      author: 'התבודדות / עקיבא תורג׳מן',
    })
    expect(result?.category).toBe('modern')
  })

  it('detects Karduner', () => {
    const result = classifyHebrewSongHeuristic({
      id: '2',
      title: 'שיר למעלות',
      author: 'יוסף קארדונר',
    })
    expect(result?.category).toBe('karduner')
    expect(categoryToCatalogGenre(result!.category)).toBe(
      HEBREW_CATALOG_GENRES.karduner
    )
  })

  it('detects Carlebach', () => {
    const result = classifyHebrewSongHeuristic({
      id: '3',
      title: 'לכה דודי',
      author: 'Shlomo Carlebach',
    })
    expect(result?.category).toBe('carlebach')
  })

  it('detects Hanan Ben Ari as own bucket', () => {
    const result = classifyHebrewSongHeuristic({
      id: '3b',
      title: 'אחי',
      author: 'חנן בן ארי',
    })
    expect(result?.category).toBe('hanan_ben_ari')
    expect(categoryToCatalogGenre(result!.category)).toBe(
      HEBREW_CATALOG_GENRES.hananBenAri
    )
  })

  it('detects Aharon Razel as own bucket (not Yonatan)', () => {
    expect(
      classifyHebrewSongHeuristic({
        id: '3c',
        title: 'לכה דודי',
        author: 'אהרן רזאל',
      })?.category
    ).toBe('aharon_razel')
    expect(
      classifyHebrewSongHeuristic({
        id: '3d',
        title: 'ויהי נועם',
        author: 'יונתן רזאל',
      })?.category
    ).toBe('modern')
  })

  it('returns null when unknown', () => {
    expect(
      classifyHebrewSongHeuristic({
        id: '4',
        title: 'שיר לא ידוע',
        author: 'אמן לא ידוע',
      })
    ).toBeNull()
  })
})
