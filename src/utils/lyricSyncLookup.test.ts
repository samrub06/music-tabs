import { describe, expect, it } from 'vitest'
import { lyricSyncLookupSongIds } from '@/utils/lyricSyncLookup'

describe('lyricSyncLookupSongIds', () => {
  it('returns only songId when no clonedFromId', () => {
    expect(lyricSyncLookupSongIds('user-1')).toEqual(['user-1'])
    expect(lyricSyncLookupSongIds('user-1', null)).toEqual(['user-1'])
    expect(lyricSyncLookupSongIds('user-1', undefined)).toEqual(['user-1'])
  })

  it('appends catalog clonedFromId after personal id', () => {
    expect(lyricSyncLookupSongIds('user-clone', 'catalog-42')).toEqual([
      'user-clone',
      'catalog-42',
    ])
  })

  it('does not duplicate when clonedFromId equals songId', () => {
    expect(lyricSyncLookupSongIds('same', 'same')).toEqual(['same'])
  })

  it('UG and Negina clones keep separate catalog ids (no cross-read)', () => {
    const ugClone = lyricSyncLookupSongIds('ug-user', 'ug-catalog')
    const neginaClone = lyricSyncLookupSongIds('negina-user', 'negina-catalog')
    expect(ugClone).not.toContain('negina-catalog')
    expect(neginaClone).not.toContain('ug-catalog')
  })
})
