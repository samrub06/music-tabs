import { describe, expect, it } from 'vitest'
import {
  assertAllowedCatalogSourceUrl,
  buildCatalogSourceIdentity,
  catalogTabIdLookupCandidates,
  deriveTabIdFromSourceUrl,
  findUserSongBySourceIdentity,
  isAllowedCatalogSourceHost,
  normalizeCatalogSourceUrl,
} from '@/lib/utils/catalogSourceIdentity'

describe('catalogSourceIdentity', () => {
  it('allows known chord-site hosts', () => {
    expect(isAllowedCatalogSourceHost('tabs.ultimate-guitar.com')).toBe(true)
    expect(isAllowedCatalogSourceHost('www.ultimate-guitar.com')).toBe(true)
    expect(isAllowedCatalogSourceHost('www.tab4u.com')).toBe(true)
    expect(isAllowedCatalogSourceHost('negina.co.il')).toBe(true)
  })

  it('rejects unknown hosts', () => {
    expect(isAllowedCatalogSourceHost('evil.example.com')).toBe(false)
    expect(() =>
      assertAllowedCatalogSourceUrl('https://evil.example.com/song')
    ).toThrow(/not allowed/i)
  })

  it('normalizes URLs (https, strip utm, trim trailing slash)', () => {
    expect(
      normalizeCatalogSourceUrl(
        'http://tabs.ultimate-guitar.com/tab/artist/song-chords-123456?utm_source=x&fbclid=1'
      )
    ).toBe('https://tabs.ultimate-guitar.com/tab/artist/song-chords-123456')
  })

  it('derives tab ids from source URLs', () => {
    expect(
      deriveTabIdFromSourceUrl(
        'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456'
      )
    ).toBe('2123456')

    expect(
      deriveTabIdFromSourceUrl('https://www.tab4u.com/tabs/songs/98765')
    ).toBe('tab4u:98765')

    expect(
      deriveTabIdFromSourceUrl(
        'https://negina.co.il/chords/artist-slug/song-slug/'
      )
    ).toBe('negina:artist-slug:song-slug')
  })

  it('prefers explicit tabId over derived', () => {
    const identity = buildCatalogSourceIdentity({
      url: 'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456',
      tabId: '99999',
    })
    expect(identity.tabId).toBe('99999')
    expect(identity.sourceUrl).toContain('beau-papa-chords-2123456')
  })

  it('Negina and UG tab ids are different candidates', () => {
    const ug = buildCatalogSourceIdentity({
      url: 'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456',
    })
    const negina = buildCatalogSourceIdentity({
      url: 'https://negina.co.il/chords/vianney/beau-papa',
    })
    expect(ug.tabId).toBe('2123456')
    expect(negina.tabId).toBe('negina:vianney:beau-papa')
    expect(ug.tabId).not.toBe(negina.tabId)
  })

  it('includes ug: prefix as lookup candidate for numeric UG ids', () => {
    const identity = buildCatalogSourceIdentity({
      url: 'https://tabs.ultimate-guitar.com/tab/x/y-chords-2123456',
      tabId: '2123456',
    })
    expect(catalogTabIdLookupCandidates(identity)).toContain('2123456')
    expect(catalogTabIdLookupCandidates(identity)).toContain('ug:2123456')
  })

  it('findUserSongBySourceIdentity matches tabId then sourceUrl, never title', () => {
    const identity = buildCatalogSourceIdentity({
      url: 'https://tabs.ultimate-guitar.com/tab/a/b-chords-11111',
      tabId: '11111',
    })
    const songs = [
      {
        id: 'wrong-title-match',
        title: 'Beau Papa',
        author: 'Vianney',
        sourceUrl: 'https://negina.co.il/chords/other/song',
      },
      {
        id: 'by-tab',
        tabId: '11111',
        title: 'Other',
        author: 'X',
        sourceUrl: 'https://example.com',
      },
    ]
    // title fields ignored — only tab/url
    expect(findUserSongBySourceIdentity(identity, songs)?.id).toBe('by-tab')
  })

  it('returns undefined when identity has no matching tab or url', () => {
    const identity = buildCatalogSourceIdentity({
      url: 'https://tabs.ultimate-guitar.com/tab/a/b-chords-22222',
    })
    expect(
      findUserSongBySourceIdentity(identity, [
        { id: '1', tabId: '999', sourceUrl: 'https://tabs.ultimate-guitar.com/other' },
      ])
    ).toBeUndefined()
  })
})
