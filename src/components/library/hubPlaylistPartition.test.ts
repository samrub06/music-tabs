import { describe, expect, it } from 'vitest'
import {
  extractArtistBannerPair,
  partitionHubPlaylists,
} from './hubPlaylistPartition'
import type { PublicPlaylistItem } from '@/components/library/LibraryGridSection'

function item(slug: string, orderName: string, id = slug): PublicPlaylistItem {
  return {
    id,
    name: orderName,
    songCount: 3,
    curatedSlug: slug,
  }
}

describe('partitionHubPlaylists', () => {
  it('puts preferred slugs in featured and fills list then square', () => {
    const playlists = [
      item('classic-israeli', 'Classic'),
      item('modern-israeli', 'Modern'),
      item('hanan-ben-ari', 'Hanan'),
      item('aharon-razel', 'Aharon'),
      item('eviatar-banai', 'Eviatar'),
      item('shuli-rand', 'Shuli'),
      item('ishay-ribo', 'Ribo'),
      item('akiva', 'Akiva'),
      item('spotify-top-israel', 'Top IL'),
      item('yosef-karduner', 'Karduner'),
    ]

    const { list, square, featured } = partitionHubPlaylists(playlists, 0)

    expect(featured.map((p) => p.curatedSlug)).toEqual([
      'spotify-top-israel',
      'ishay-ribo',
    ])
    expect(list.length).toBeGreaterThanOrEqual(6)
    expect(list.length).toBeLessThanOrEqual(12)
    const allIds = [...list, ...square, ...featured].map((p) => p.id).sort()
    expect(allIds).toEqual(playlists.map((p) => p.id).sort())
  })

  it('reduces list slots when shortcuts occupy space', () => {
    const unique = Array.from({ length: 10 }, (_, i) =>
      item(
        [
          'acoustic',
          'world-music',
          'rock',
          'pop',
          'metal',
          'folk',
          'country',
          'jazz',
          'blues',
          'disco',
        ][i]!,
        `P${i}`,
        `id-${i}`
      )
    )

    const { list } = partitionHubPlaylists(unique, 2)
    expect(list.length).toBeLessThanOrEqual(10)
  })

  it('accepts a higher listSlots budget for taller Israeli strips', () => {
    const playlists = Array.from({ length: 20 }, (_, i) =>
      item(`slug-${i}`, `P${i}`, `id-${i}`)
    )
    const { list } = partitionHubPlaylists(playlists, 0, { listSlots: 18 })
    expect(list.length).toBeLessThanOrEqual(18)
    expect(list.length).toBeGreaterThan(12)
  })

  it('does not promote hassidic into featured when present with other songbook shelves', () => {
    const playlists = [
      item('chabad-nigunim', 'Chabad'),
      item('hassidic', 'Hassidique'),
      item('carlebach', 'Carlebach'),
      item('moroccan-piyut', 'Moroccan'),
      item('tunisian', 'Tunisien'),
      item('jewish-liturgy', 'Liturgy'),
      item('yeshiva', 'Yeshiva'),
      item('jewish-songbook', 'Songbook'),
      item('tab4u-hassidic-full', 'Tab4U'),
    ]

    const { featured } = partitionHubPlaylists(playlists, 0)
    expect(featured.map((p) => p.curatedSlug)).not.toContain('hassidic')
    expect(featured.map((p) => p.curatedSlug)).not.toContain('carlebach')
  })
})

describe('extractArtistBannerPair', () => {
  it('pulls hassidic and carlebach into a side-by-side pair', () => {
    const banners = [
      item('hassidic', 'Hassidique'),
      item('kendji-girac', 'Kendji'),
      item('carlebach', 'Carlebach'),
    ]

    const { pair, rest } = extractArtistBannerPair(banners)

    expect(pair.map((p) => p.curatedSlug)).toEqual(['hassidic', 'carlebach'])
    expect(rest.map((p) => p.curatedSlug)).toEqual(['kendji-girac'])
  })

  it('leaves banners alone when only one of the pair is present', () => {
    const banners = [item('hassidic', 'Hassidique'), item('kendji-girac', 'Kendji')]
    const { pair, rest } = extractArtistBannerPair(banners)
    expect(pair).toEqual([])
    expect(rest).toEqual(banners)
  })
})
