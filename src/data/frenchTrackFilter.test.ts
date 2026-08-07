import { describe, expect, it } from 'vitest'
import {
  filterFrenchOnlyTracks,
  isBlockedNonFrenchArtist,
  isFrenchCatalogTrack,
  isLikelyFrenchArtist,
} from '@/data/frenchTrackFilter'

describe('frenchTrackFilter', () => {
  it('blocks Bad Bunny and other global chart invaders', () => {
    expect(isBlockedNonFrenchArtist('Bad Bunny')).toBe(true)
    expect(isBlockedNonFrenchArtist('Drake')).toBe(true)
    expect(isBlockedNonFrenchArtist('Karol G')).toBe(true)
    expect(isFrenchCatalogTrack('DtMF', 'Bad Bunny')).toBe(false)
  })

  it('keeps francophone variété artists', () => {
    expect(isLikelyFrenchArtist('Kendji Girac')).toBe(true)
    expect(isLikelyFrenchArtist('Jean-Jacques Goldman')).toBe(true)
    expect(isLikelyFrenchArtist('Patrick Bruel')).toBe(true)
    expect(isLikelyFrenchArtist('Céline Dion')).toBe(true)
    expect(isLikelyFrenchArtist('Vianney')).toBe(true)
    expect(isLikelyFrenchArtist('Emmanuel Moire')).toBe(true)
    expect(isBlockedNonFrenchArtist('Emmanuel Moire')).toBe(false)
    expect(isFrenchCatalogTrack('Andalouse', 'Kendji Girac')).toBe(true)
    expect(isFrenchCatalogTrack('Je te donne', 'Jean-Jacques Goldman')).toBe(
      true
    )
  })

  it('does not treat Anuel substring inside Emmanuel as blocked', () => {
    expect(isBlockedNonFrenchArtist('Anuel AA')).toBe(true)
    expect(isBlockedNonFrenchArtist('Emmanuel Moire')).toBe(false)
  })

  it('filters mixed chart rows to French-only', () => {
    const kept = filterFrenchOnlyTracks([
      { title: 'DtMF', artist: 'Bad Bunny' },
      { title: 'Andalouse', artist: 'Kendji Girac' },
      { title: 'Casser la voix', artist: 'Patrick Bruel' },
      { title: 'Espresso', artist: 'Sabrina Carpenter' },
    ])
    expect(kept.map((t) => t.artist)).toEqual([
      'Kendji Girac',
      'Patrick Bruel',
    ])
  })
})
