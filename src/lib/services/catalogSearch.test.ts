import { describe, expect, it } from 'vitest'
import { mergeCatalogAndExternalResults } from '@/lib/services/catalogSearch'

describe('mergeCatalogAndExternalResults', () => {
  const ugUrl =
    'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456'
  const neginaUrl = 'https://negina.co.il/chords/vianney/beau-papa'

  it('puts catalog results first', () => {
    const merged = mergeCatalogAndExternalResults(
      [
        {
          title: 'Beau Papa',
          author: 'Vianney',
          url: ugUrl,
          source: 'Ultimate Guitar',
          tabId: '2123456',
          catalogSongId: 'cat-1',
          fromCatalog: true,
        },
      ],
      [
        {
          title: 'Other',
          author: 'X',
          url: 'https://tabs.ultimate-guitar.com/tab/x/y-chords-99999',
          source: 'Ultimate Guitar',
          tabId: '99999',
        },
      ]
    )
    expect(merged[0]?.catalogSongId).toBe('cat-1')
    expect(merged).toHaveLength(2)
  })

  it('dedupes external row with same tabId as catalog', () => {
    const merged = mergeCatalogAndExternalResults(
      [
        {
          title: 'Beau Papa',
          author: 'Vianney',
          url: ugUrl,
          source: 'Ultimate Guitar',
          tabId: '2123456',
          catalogSongId: 'cat-1',
        },
      ],
      [
        {
          title: 'Beau Papa',
          author: 'Vianney',
          url: ugUrl + '?utm_source=x',
          source: 'Ultimate Guitar',
          tabId: '2123456',
        },
      ]
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.catalogSongId).toBe('cat-1')
  })

  it('keeps UG and Negina same title when urls differ', () => {
    const merged = mergeCatalogAndExternalResults(
      [
        {
          title: 'Beau Papa',
          author: 'Vianney',
          url: ugUrl,
          source: 'Ultimate Guitar',
          tabId: '2123456',
          catalogSongId: 'cat-ug',
        },
      ],
      [
        {
          title: 'Beau Papa',
          author: 'Vianney',
          url: neginaUrl,
          source: 'Negina',
          tabId: 'negina:vianney:beau-papa',
        },
      ]
    )
    expect(merged).toHaveLength(2)
  })
})
