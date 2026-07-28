import { describe, expect, it } from 'vitest'
import { classifyLibraryMembership } from '@/lib/utils/libraryMembership'

describe('library like ownership routing', () => {
  it('treats catalog songs as library_link when linked', () => {
    expect(
      classifyLibraryMembership({
        songUserId: null,
        currentUserId: 'me',
        hasLibraryLink: true,
      })
    ).toBe('library_link')
  })

  it('prefers personal ownership for like target when user owns the row', () => {
    // Likes still go through user_library.toggleLike(songId) for both cases;
    // membership kind remains personal when owning the row.
    expect(
      classifyLibraryMembership({
        songUserId: 'me',
        currentUserId: 'me',
        hasLibraryLink: true,
      })
    ).toBe('personal')
  })
})
