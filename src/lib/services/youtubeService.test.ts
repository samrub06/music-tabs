import { describe, expect, it } from 'vitest'
import {
  isLikelyEmbedRestricted,
  scoreYoutubeEmbedCandidate,
} from '@/lib/services/youtubeService'

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
})
