import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import PlaylistDetailClient from './PlaylistDetailClient'
import type { Playlist } from '@/types'

interface PlaylistSongsDataProps {
  playlist: Playlist
}

export default async function PlaylistSongsData({ playlist }: PlaylistSongsDataProps) {
  const supabase = await createSafeServerClient()
  const playlistSongs = await songRepo(supabase).getSongsByIds(playlist.songIds)

  return <PlaylistDetailClient playlist={playlist} songs={playlistSongs} />
}
