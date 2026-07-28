import { describe, expect, it } from 'vitest'
import {
  buildCatalogSourceIndex,
  canPromoteUserSongToCatalog,
  matchCatalogBySourceIdentity,
} from '@/lib/utils/catalogSourceIndex'

describe('catalogSourceIndex / matchCatalogBySourceIdentity', () => {
  const ugCatalog = {
    id: 'cat-ug',
    tabId: '2123456',
    sourceUrl:
      'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456',
  }
  const neginaCatalog = {
    id: 'cat-negina',
    tabId: 'negina:vianney:beau-papa',
    sourceUrl: 'https://negina.co.il/chords/vianney/beau-papa',
  }

  const index = buildCatalogSourceIndex([ugCatalog, neginaCatalog])

  it('matches UG user song by tabId', () => {
    expect(
      matchCatalogBySourceIdentity(
        { id: 'user-1', tabId: '2123456', sourceUrl: ugCatalog.sourceUrl },
        index
      )
    ).toBe('cat-ug')
  })

  it('matches UG via ug: prefixed tabId', () => {
    expect(
      matchCatalogBySourceIdentity({ id: 'user-1', tabId: 'ug:2123456' }, index)
    ).toBe('cat-ug')
  })

  it('matches Negina by source URL', () => {
    expect(
      matchCatalogBySourceIdentity(
        {
          id: 'user-2',
          sourceUrl: 'https://negina.co.il/chords/vianney/beau-papa/?utm_source=x',
        },
        index
      )
    ).toBe('cat-negina')
  })

  it('does not match same title across UG vs Negina', () => {
    // User has Negina URL but we only look up — must not return UG catalog
    expect(
      matchCatalogBySourceIdentity(
        {
          id: 'user-3',
          sourceUrl: 'https://negina.co.il/chords/vianney/beau-papa',
        },
        index
      )
    ).toBe('cat-negina')
    expect(
      matchCatalogBySourceIdentity(
        {
          id: 'user-4',
          sourceUrl: ugCatalog.sourceUrl,
        },
        index
      )
    ).toBe('cat-ug')
  })

  it('returns null when missing identity (title-only would have matched before)', () => {
    expect(
      matchCatalogBySourceIdentity(
        { id: 'user-5', tabId: null, sourceUrl: null },
        index
      )
    ).toBeNull()
  })

  it('returns null for unknown tab/url', () => {
    expect(
      matchCatalogBySourceIdentity(
        {
          id: 'user-6',
          tabId: '99999',
          sourceUrl:
            'https://tabs.ultimate-guitar.com/tab/other/song-chords-99999',
        },
        index
      )
    ).toBeNull()
  })

  it('canPromoteUserSongToCatalog only for allowlisted hosts with URL', () => {
    expect(
      canPromoteUserSongToCatalog({
        id: '1',
        sourceUrl: ugCatalog.sourceUrl,
      })
    ).toBe(true)
    expect(
      canPromoteUserSongToCatalog({
        id: '2',
        sourceUrl: 'https://evil.example.com/x',
      })
    ).toBe(false)
    expect(canPromoteUserSongToCatalog({ id: '3', tabId: '2123456' })).toBe(
      false
    )
  })
})
