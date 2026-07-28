import { describe, expect, it, vi } from 'vitest'
import {
  resolveCatalogSongFromSearch,
  type CatalogSongLookup,
} from '@/lib/services/resolveCatalogSongFromSearch'
import type { Song } from '@/types'

function makeSong(overrides: Partial<Song> & { id: string }): Song {
  return {
    title: 'Beau Papa',
    author: 'Vianney',
    content: '[C] lyrics',
    sections: [],
    format: 'structured',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Song
}

describe('resolveCatalogSongFromSearch', () => {
  const ugUrl =
    'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456'

  it('hit: returns catalog song and never scrapes', async () => {
    const scrape = vi.fn()
    const catalogSong = makeSong({
      id: 'catalog-1',
      sourceUrl: ugUrl,
      tabId: '2123456',
      userId: undefined,
      isPublic: true,
    })
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn().mockResolvedValue({ id: 'catalog-1' }),
      getSong: vi.fn().mockResolvedValue(catalogSong),
      createSystemSong: vi.fn(),
    }

    const result = await resolveCatalogSongFromSearch(
      { url: ugUrl, title: 'Beau Papa', author: 'Vianney', tabId: '2123456' },
      { catalog, scrape }
    )

    expect(result.scraped).toBe(false)
    expect(result.catalogSongId).toBe('catalog-1')
    expect(scrape).not.toHaveBeenCalled()
    expect(catalog.createSystemSong).not.toHaveBeenCalled()
  })

  it('miss: scrapes once and creates catalog song', async () => {
    const scrape = vi.fn().mockResolvedValue({
      title: 'Beau Papa',
      author: 'Vianney',
      content: '[C] papa',
      source: 'Ultimate Guitar',
      url: ugUrl,
      tabId: 2123456,
    })
    const created = makeSong({
      id: 'new-catalog',
      sourceUrl: ugUrl,
      tabId: '2123456',
      isPublic: true,
    })
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn().mockResolvedValue(null),
      getSong: vi.fn(),
      createSystemSong: vi.fn().mockResolvedValue(created),
    }

    const result = await resolveCatalogSongFromSearch(
      { url: ugUrl, title: 'Beau Papa', author: 'Vianney' },
      { catalog, scrape }
    )

    expect(result.scraped).toBe(true)
    expect(result.catalogSongId).toBe('new-catalog')
    expect(scrape).toHaveBeenCalledTimes(1)
    expect(catalog.createSystemSong).toHaveBeenCalledTimes(1)
    const payload = (catalog.createSystemSong as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(payload.sourceUrl).toContain('beau-papa-chords-2123456')
    expect(payload.tabId).toBe('2123456')
  })

  it('second call with same identity does not scrape again', async () => {
    const scrape = vi.fn()
    const catalogSong = makeSong({ id: 'catalog-1', tabId: '2123456', sourceUrl: ugUrl })
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn().mockResolvedValue({ id: 'catalog-1' }),
      getSong: vi.fn().mockResolvedValue(catalogSong),
      createSystemSong: vi.fn(),
    }

    await resolveCatalogSongFromSearch({ url: ugUrl, tabId: '2123456' }, { catalog, scrape })
    await resolveCatalogSongFromSearch({ url: ugUrl, tabId: '2123456' }, { catalog, scrape })

    expect(scrape).not.toHaveBeenCalled()
    expect(catalog.createSystemSong).not.toHaveBeenCalled()
  })

  it('rejects disallowed host before scrape', async () => {
    const scrape = vi.fn()
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn(),
      getSong: vi.fn(),
      createSystemSong: vi.fn(),
    }

    await expect(
      resolveCatalogSongFromSearch(
        { url: 'https://evil.example.com/tab/1' },
        { catalog, scrape }
      )
    ).rejects.toThrow(/not allowed/i)

    expect(scrape).not.toHaveBeenCalled()
    expect(catalog.findCatalogSongBySourceIdentity).not.toHaveBeenCalled()
  })

  it('on create race, re-finds existing catalog without throwing', async () => {
    const scrape = vi.fn().mockResolvedValue({
      title: 'Beau Papa',
      author: 'Vianney',
      content: '[C] papa',
      source: 'Ultimate Guitar',
      tabId: 2123456,
    })
    const existing = makeSong({ id: 'raced', tabId: '2123456', sourceUrl: ugUrl })
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi
        .fn()
        .mockResolvedValueOnce(null) // initial
        .mockResolvedValueOnce(null) // post-scrape race check
        .mockResolvedValueOnce({ id: 'raced' }), // after create error
      getSong: vi.fn().mockResolvedValue(existing),
      createSystemSong: vi.fn().mockRejectedValue(new Error('duplicate')),
    }

    const result = await resolveCatalogSongFromSearch(
      { url: ugUrl },
      { catalog, scrape }
    )

    expect(result.catalogSongId).toBe('raced')
    expect(result.scraped).toBe(false)
  })
})
