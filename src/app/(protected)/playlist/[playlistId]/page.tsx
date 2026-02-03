import { createSafeServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import PlaylistDetailClient from './PlaylistDetailClient'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

export default async function PlaylistDetailPage({
  params
}: {
  params: Promise<{ playlistId: string }>
}) {
  noStore()
  
  const { playlistId } = await params
  const supabase = await createSafeServerClient()
  
  try {
    const playlist = await playlistRepo(supabase).getPlaylist(playlistId)
    
    // Récupérer uniquement les chansons de la playlist (optimisé)
    const repo = songRepo(supabase)
    const playlistSongs = await repo.getSongsByIds(playlist.songIds)

    return <PlaylistDetailClient playlist={playlist} songs={playlistSongs} />
  } catch (error) {
    console.error('Error loading playlist:', error)
    notFound()
  }
}
