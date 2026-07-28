import { describe, expect, it } from 'vitest'
import {
  catalogSourceIdentityDedupKey,
  groupCatalogSongsBySourceIdentity,
} from '@/lib/utils/catalogSongDedup'

describe('catalogSourceIdentityDedupKey', () => {
  it('groups same url together', () => {
    const a = catalogSourceIdentityDedupKey({
      source_url:
        'https://tabs.ultimate-guitar.com/tab/x/y-chords-1?utm_source=z',
      tab_id: null,
    })
    const b = catalogSourceIdentityDedupKey({
      source_url: 'http://tabs.ultimate-guitar.com/tab/x/y-chords-1/',
      tab_id: null,
    })
    expect(a).toBeTruthy()
    expect(a).toBe(b)
  })

  it('does not merge UG and Negina same title (different urls)', () => {
    const ug = catalogSourceIdentityDedupKey({
      source_url:
        'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456',
      tab_id: '2123456',
    })
    const neg = catalogSourceIdentityDedupKey({
      source_url: 'https://negina.co.il/chords/vianney/beau-papa',
      tab_id: 'negina:vianney:beau-papa',
    })
    expect(ug).not.toBe(neg)
  })

  it('returns null without source identity (no title-only merge)', () => {
    expect(
      catalogSourceIdentityDedupKey({ source_url: null, tab_id: null })
    ).toBeNull()
  })

  it('groupCatalogSongsBySourceIdentity only duplicates with identity', () => {
    const groups = groupCatalogSongsBySourceIdentity([
      {
        id: '1',
        title: 'A',
        author: 'X',
        source_url: 'https://tabs.ultimate-guitar.com/tab/a/a-chords-11111',
        tab_id: '11111',
      },
      {
        id: '2',
        title: 'A',
        author: 'X',
        source_url: 'https://tabs.ultimate-guitar.com/tab/a/a-chords-11111',
        tab_id: '11111',
      },
      {
        id: '3',
        title: 'A',
        author: 'X',
        source_url: null,
        tab_id: null,
      },
    ])
    const dupes = groups.filter((g) => g.length > 1)
    expect(dupes).toHaveLength(1)
    expect(dupes[0]).toHaveLength(2)
  })
})
