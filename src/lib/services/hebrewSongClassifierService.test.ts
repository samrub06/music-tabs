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

  it('detects Ben Zur as own bucket (not Hanan Ben Ari)', () => {
    const result = classifyHebrewSongHeuristic({
      id: '3bz',
      title: 'אבא',
      author: 'בן צור',
    })
    expect(result?.category).toBe('ben_zur')
    expect(categoryToCatalogGenre(result!.category)).toBe(
      HEBREW_CATALOG_GENRES.benZur
    )
  })

  it('detects Eyal Golan and Omer Adam as own buckets', () => {
    expect(
      classifyHebrewSongHeuristic({
        id: '3eg',
        title: 'עם ישראל חי',
        author: 'אייל גולן',
      })?.category
    ).toBe('eyal_golan')
    expect(
      classifyHebrewSongHeuristic({
        id: '3oa',
        title: 'תל אביב',
        author: 'עומר אדם',
      })?.category
    ).toBe('omer_adam')
  })

  it('detects new Israeli artist shelves', () => {
    expect(
      classifyHebrewSongHeuristic({
        id: 'eh',
        title: 'שקיעות אדומות',
        author: 'עדן חסון',
      })?.category
    ).toBe('eden_hason')
    expect(
      classifyHebrewSongHeuristic({
        id: 'sh',
        title: 'הייתי בגן עדן',
        author: 'שרית חדד',
      })?.category
    ).toBe('sarit_hadad')
    expect(
      classifyHebrewSongHeuristic({
        id: 'mp',
        title: 'אש',
        author: 'משה פרץ',
      })?.category
    ).toBe('moshe_peretz')
    expect(
      classifyHebrewSongHeuristic({
        id: 'ng',
        title: 'כל מה שיש לי',
        author: 'נתן גושן',
      })?.category
    ).toBe('nathan_goshen')
    expect(
      classifyHebrewSongHeuristic({
        id: 'ir',
        title: 'ממעמקים',
        author: 'הפרוייקט של עידן רייכל',
      })?.category
    ).toBe('idan_raichel')
    expect(
      classifyHebrewSongHeuristic({
        id: 'sa',
        title: 'ירח',
        author: 'שלמה ארצי',
      })?.category
    ).toBe('shlomo_artzi')
    expect(
      classifyHebrewSongHeuristic({
        id: 'sbe',
        title: 'סלסולים',
        author: 'סטטיק ובן אל תבורי',
      })?.category
    ).toBe('static_ben_el')
    expect(
      classifyHebrewSongHeuristic({
        id: 'nk',
        title: 'פנתרה',
        author: 'נועה קירל',
      })?.category
    ).toBe('noa_kirel')
    expect(
      classifyHebrewSongHeuristic({
        id: 'il',
        title: 'קירות',
        author: 'איתי לוי',
      })?.category
    ).toBe('itay_levi')
    expect(
      classifyHebrewSongHeuristic({
        id: 'oc',
        title: 'אהבה',
        author: 'אושר כהן',
      })?.category
    ).toBe('osher_cohen')
    expect(
      classifyHebrewSongHeuristic({
        id: 'ao',
        title: 'שירים וחלומות',
        author: 'אבי אוחיון',
      })?.category
    ).toBe('avi_ohayon')
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

  it('detects liturgy markers', () => {
    const result = classifyHebrewSongHeuristic({
      id: '4a',
      title: 'ברכת המזון',
      author: 'Unknown',
    })
    expect(result?.category).toBe('liturgy')
    expect(categoryToCatalogGenre(result!.category)).toBe(
      HEBREW_CATALOG_GENRES.liturgy
    )
  })

  it('detects yeshiva choir markers', () => {
    const result = classifyHebrewSongHeuristic({
      id: '4b',
      title: 'ניגון',
      author: 'Miami Boys Choir',
    })
    expect(result?.category).toBe('yeshiva')
    expect(categoryToCatalogGenre(result!.category)).toBe(
      HEBREW_CATALOG_GENRES.yeshiva
    )
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
