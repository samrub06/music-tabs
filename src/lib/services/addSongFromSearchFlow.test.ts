import { describe, expect, it, vi } from 'vitest'
import { planAddSongFromSearch } from '@/lib/services/addSongFromSearchFlow'
import type { CatalogSongLookup } from '@/lib/services/resolveCatalogSongFromSearch'
import type { Song } from '@/types'

const ugUrl =
  'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456'

function makeSong(id: string): Song {
  return {
    id,
    title: 'Beau Papa',
    author: 'Vianney',
    content: '[C]',
    sections: [],
    format: 'structured',
    createdAt: new Date(),
    updatedAt: new Date(),
    sourceUrl: ugUrl,
    tabId: '2123456',
    isPublic: true,
  } as Song
}

describe('planAddSongFromSearch', () => {
  it('returns already_owned when user has same source identity (no scrape)', async () => {
    const scrape = vi.fn()
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn(),
      getSong: vi.fn(),
      createSystemSong: vi.fn(),
    }

    const result = await planAddSongFromSearch({
      search: { url: ugUrl, tabId: '2123456' },
      userSongs: [{ id: 'user-song-1', tabId: '2123456', sourceUrl: ugUrl }],
      deps: { catalog, scrape },
    })

    expect(result).toEqual({
      status: 'already_owned',
      songId: 'user-song-1',
      scraped: false,
    })
    expect(scrape).not.toHaveBeenCalled()
    expect(catalog.findCatalogSongBySourceIdentity).not.toHaveBeenCalled()
  })

  it('returns needs_clone when catalog hit and user does not own it', async () => {
    const scrape = vi.fn()
    const catalogSong = makeSong('catalog-1')
    const catalog: CatalogSongLookup = {
      findCatalogSongBySourceIdentity: vi.fn().mockResolvedValue({ id: 'catalog-1' }),
      getSong: vi.fn().mockResolvedValue(catalogSong),
      createSystemSong: vi.fn(),
    }

    const result = await planAddSongFromSearch({
      search: { url: ugUrl, tabId: '2123456' },
      userSongs: [],
      deps: { catalog, scrape },
    })

    expect(result.status).toBe('needs_clone')
    if (result.status === 'needs_clone') {
      expect(result.catalogSongId).toBe('catalog-1')
      expect(result.scraped).toBe(false)
    }
    expect(scrape).not.toHaveBeenCalled()
  })
})
