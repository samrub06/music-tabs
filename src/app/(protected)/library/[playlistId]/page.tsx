import { createSafeServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import PublicPlaylistDetailClient from './PublicPlaylistDetailClient'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

export default async function PublicPlaylistDetailPage({
  params
}: {
  params: Promise<{ playlistId: string }>
}) {
  noStore()

  const { playlistId } = await params
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const playlist = await playlistRepo(supabase).getPublicPlaylist(playlistId)
    const playlistSongs = await songRepo(supabase).getSongsByIdsForPublicPlaylist(playlist.songIds)

    return (
      <PublicPlaylistDetailClient
        playlist={playlist}
        songs={playlistSongs}
        userId={user?.id}
      />
    )
  } catch {
    notFound()
  }
}
