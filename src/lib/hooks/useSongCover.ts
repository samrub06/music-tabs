'use client'

import { useAuthContext } from '@/context/AuthContext'
import { resolveSongCoverUrl, type SongCoverInput } from '@/utils/songCover'

export function useSongCover(song: SongCoverInput): string | undefined {
  const { profile } = useAuthContext()

  return resolveSongCoverUrl({
    songImageUrl: song.songImageUrl,
    artistImageUrl: song.artistImageUrl,
    genre: song.genre,
    tsnioutFilterEnabled: profile?.tsniout_filter_enabled ?? false,
  })
}
