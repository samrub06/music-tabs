import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import type { Playlist, Song } from '@/types'

/** Per-request dedupe for metadata + page shell. */
export const getCachedPublicPlaylist = cache(async (id: string): Promise<Playlist> => {
  const supabase = await createSafeServerClient()
  return playlistRepo(supabase).getPublicPlaylist(id)
})

/** Cross-request cache for public curated playlist song lists (titles + covers only). */
export function getCachedPublicPlaylistSongs(playlistId: string): Promise<Song[]> {
  return unstable_cache(
    async () => {
      const supabase = await createSafeServerClient()
      const playlist = await playlistRepo(supabase).getPublicPlaylist(playlistId)
      return songRepo(supabase).getSongsByIdsForPublicPlaylist(playlist.songIds)
    },
    [`public-playlist-songs-${playlistId}`],
    { revalidate: 3600, tags: [`public-playlist-${playlistId}`] }
  )()
}
