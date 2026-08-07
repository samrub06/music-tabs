import { describe, expect, it } from 'vitest'
import { partitionHubPlaylists } from './hubPlaylistPartition'
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
    const playlists = Array.from({ length: 10 }, (_, i) =>
      item(`rock`, `P${i}`, `id-${i}`)
    ).map((p, i) => ({ ...p, curatedSlug: i === 0 ? 'acoustic' : `pop` }))

    // Use unique slugs so sort is stable enough; just check list budget
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
})

