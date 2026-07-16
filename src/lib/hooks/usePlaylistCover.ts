'use client'

import { useAuthContext } from '@/context/AuthContext'
import {
  resolvePlaylistCoverUrl,
  type PlaylistCoverInput,
} from '@/utils/playlistCover'

export function usePlaylistCover(playlist: PlaylistCoverInput): string | null {
  const { profile } = useAuthContext()

  return resolvePlaylistCoverUrl({
    name: playlist.name,
    imageUrl: playlist.imageUrl,
    curatedSlug: playlist.curatedSlug,
    tsnioutFilterEnabled: profile?.tsniout_filter_enabled ?? false,
  })
}
