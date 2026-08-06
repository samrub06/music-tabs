import { describe, expect, it } from 'vitest'
import { triageGenreHeuristic } from '@/data/genreTriageHeuristics'

describe('triageGenreHeuristic', () => {
  it('maps Beatles to rock', () => {
    expect(
      triageGenreHeuristic({ title: 'Love Me Do', author: 'The Beatles' })?.genre
    ).toBe('4')
  })

  it('maps French chanson to french-variete', () => {
    expect(
      triageGenreHeuristic({ title: 'Ne me quitte pas', author: 'Jacques Brel' })
        ?.genre
    ).toBe('french-variete')
  })

  it('skips Hebrew for classify pipeline', () => {
    expect(
      triageGenreHeuristic({ title: 'אחי', author: 'חנן בן ארי' })
    ).toBeNull()
  })

  it('maps Marley to reggae', () => {
    expect(
      triageGenreHeuristic({ title: 'One Love', author: 'Bob Marley' })?.genre
    ).toBe('1781')
  })
})
