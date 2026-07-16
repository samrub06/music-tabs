import { PublicPlaylistSongList } from './PublicPlaylistDetailClient'
import { getCachedPublicPlaylistSongs } from './loadPublicPlaylist'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Playlist } from '@/types'

interface PublicPlaylistSongsDataProps {
  playlist: Playlist
  userId?: string
}

export default async function PublicPlaylistSongsData({
  playlist,
  userId,
}: PublicPlaylistSongsDataProps) {
  const songs = await getCachedPublicPlaylistSongs(playlist.id, playlist.songIds)

  let libraryCatalogIds: string[] = []
  if (userId) {
    const supabase = await createSafeServerClient()
    libraryCatalogIds = await songRepo(supabase).getUserLibraryCatalogSongIds()
  }

  return (
    <PublicPlaylistSongList
      playlist={playlist}
      songs={songs}
      userId={userId}
      libraryCatalogIds={libraryCatalogIds}
    />
  )
}
