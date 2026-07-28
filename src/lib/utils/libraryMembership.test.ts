import { describe, expect, it } from 'vitest'
import {
  classifyLibraryMembership,
  splitPersonalAndLinkSongIds,
} from '@/lib/utils/libraryMembership'

describe('classifyLibraryMembership', () => {
  it('prefers personal when user owns the song even if linked', () => {
    expect(
      classifyLibraryMembership({
        songUserId: 'me',
        currentUserId: 'me',
        hasLibraryLink: true,
      })
    ).toBe('personal')
  })

  it('uses library_link for catalog songs with a link', () => {
    expect(
      classifyLibraryMembership({
        songUserId: null,
        currentUserId: 'me',
        hasLibraryLink: true,
      })
    ).toBe('library_link')
  })

  it('returns none when neither owned nor linked', () => {
    expect(
      classifyLibraryMembership({
        songUserId: 'other',
        currentUserId: 'me',
        hasLibraryLink: false,
      })
    ).toBe('none')
  })
})

describe('splitPersonalAndLinkSongIds', () => {
  it('dedupes and splits owned vs link candidates', () => {
    expect(
      splitPersonalAndLinkSongIds({
        songIds: ['p1', 'c1', 'p1', 'c2'],
        ownedSongIds: new Set(['p1']),
      })
    ).toEqual({
      personalIds: ['p1'],
      linkCandidateIds: ['c1', 'c2'],
    })
  })
})
