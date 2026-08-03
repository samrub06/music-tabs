import { describe, expect, it } from 'vitest'
import { songListRowMatchesFilters } from '@/lib/services/songListFilters'

describe('songListRowMatchesFilters', () => {
  const base = {
    id: '1',
    title: 'Hello World',
    author: 'Jane Doe',
    difficulty: 'Easy',
    capo: 0,
    is_liked: false,
    view_count: 5,
  }

  it('matches query against title or author', () => {
    expect(songListRowMatchesFilters(base, { q: 'hello' })).toBe(true)
    expect(songListRowMatchesFilters(base, { q: 'jane' })).toBe(true)
    expect(songListRowMatchesFilters(base, { q: 'zzz' })).toBe(false)
  })

  it('filters easy chord and capo', () => {
    expect(songListRowMatchesFilters(base, { easyChord: true })).toBe(true)
    expect(
      songListRowMatchesFilters({ ...base, difficulty: 'Hard' }, { easyChord: true })
    ).toBe(false)
    expect(songListRowMatchesFilters(base, { capoFilter: 'without' })).toBe(true)
    expect(songListRowMatchesFilters({ ...base, capo: 3 }, { capoFilter: 'with' })).toBe(true)
    expect(songListRowMatchesFilters(base, { capoFilter: 'with' })).toBe(false)
  })

  it('filters by difficultyMax inclusive', () => {
    expect(songListRowMatchesFilters(base, { difficultyMax: 2 })).toBe(true)
    expect(
      songListRowMatchesFilters({ ...base, difficulty: '3' }, { difficultyMax: 2 })
    ).toBe(false)
    expect(
      songListRowMatchesFilters({ ...base, difficulty: 'Intermediate' }, { difficultyMax: 3 })
    ).toBe(true)
    expect(
      songListRowMatchesFilters({ ...base, difficulty: 'Advanced' }, { difficultyMax: 3 })
    ).toBe(false)
  })

  it('requires liked and popular views when those filters are on', () => {
    expect(songListRowMatchesFilters(base, { likedOnly: true })).toBe(false)
    expect(songListRowMatchesFilters({ ...base, is_liked: true }, { likedOnly: true })).toBe(true)
    expect(songListRowMatchesFilters({ ...base, view_count: 0 }, { tab: 'popular' })).toBe(false)
    expect(songListRowMatchesFilters(base, { tab: 'popular' })).toBe(true)
  })
})
