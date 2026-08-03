import { describe, expect, it } from 'vitest'
import {
  isLikelyEmbedRestricted,
  pickBestEmbedCandidate,
  scoreYoutubeEmbedCandidate,
} from '@/lib/services/youtubeService'
import { buildYoutubeOriginalQuery } from '@/utils/youtubeTutorial'

describe('youtube embed candidate ranking', () => {
  it('flags VEVO / Topic / official music video channels', () => {
    expect(
      isLikelyEmbedRestricted({
        title: 'Oasis - Wonderwall (Official Video)',
        channelTitle: 'OasisVEVO',
      })
    ).toBe(true)

    expect(
      isLikelyEmbedRestricted({
        title: 'Wonderwall',
        channelTitle: 'Oasis - Topic',
      })
    ).toBe(true)

    expect(
      isLikelyEmbedRestricted({
        title: 'Wonderwall Lyrics',
        channelTitle: 'Some Lyrics Channel',
      })
    ).toBe(false)
  })

  it('ranks lyrics/audio above official VEVO uploads', () => {
    const vevo = scoreYoutubeEmbedCandidate({
      title: 'Oasis - Wonderwall (Official Music Video)',
      channelTitle: 'OasisVEVO',
    })
    const lyrics = scoreYoutubeEmbedCandidate({
      title: 'Oasis - Wonderwall (Lyrics)',
      channelTitle: 'Lyric Channel',
    })
    expect(lyrics).toBeGreaterThan(vevo)
  })

  it('never picks VEVO when a non-restricted candidate exists', () => {
    const picked = pickBestEmbedCandidate([
      {
        videoId: 'vevo1',
        title: 'Oasis - Wonderwall (Official Music Video)',
        channelTitle: 'OasisVEVO',
      },
      {
        videoId: 'lyrics1',
        title: 'Oasis - Wonderwall (Lyrics)',
        channelTitle: 'Lyric Channel',
      },
      {
        videoId: 'audio1',
        title: 'Wonderwall (Audio)',
        channelTitle: 'Fan Uploads',
      },
    ])
    expect(picked?.videoId).not.toBe('vevo1')
    expect(picked?.videoId).toBe('lyrics1')
  })

  it('falls back to restricted only when all candidates are restricted', () => {
    const picked = pickBestEmbedCandidate([
      {
        videoId: 'vevo1',
        title: 'Song (Official Music Video)',
        channelTitle: 'ArtistVEVO',
      },
      {
        videoId: 'topic1',
        title: 'Song',
        channelTitle: 'Artist - Topic',
      },
    ])
    expect(picked?.videoId).toBeTruthy()
  })
})

describe('buildYoutubeOriginalQuery', () => {
  it('uses artist + title only', () => {
    expect(buildYoutubeOriginalQuery('Wonderwall', 'Oasis')).toBe('Oasis Wonderwall')
    expect(buildYoutubeOriginalQuery('Wonderwall', 'Oasis', 'fr')).toBe('Oasis Wonderwall')
    expect(buildYoutubeOriginalQuery('Solo', '')).toBe('Solo')
  })
})
