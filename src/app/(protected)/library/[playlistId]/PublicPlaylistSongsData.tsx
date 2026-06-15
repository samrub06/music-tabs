import { PublicPlaylistSongList } from './PublicPlaylistDetailClient'
import { getCachedPublicPlaylistSongs } from './loadPublicPlaylist'
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

  return (
    <PublicPlaylistSongList
      playlist={playlist}
      songs={songs}
      userId={userId}
    />
  )
}
