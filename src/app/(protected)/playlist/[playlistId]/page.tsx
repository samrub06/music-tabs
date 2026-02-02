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
    
    // Récupérer les chansons de la playlist
    const allSongs = await songRepo(supabase).getAllSongs()
    const playlistSongs = playlist.songIds
      .map(id => allSongs.find(s => s.id === id))
      .filter(song => song !== undefined)
      .sort((a, b) => {
        // Maintenir l'ordre de songIds
        const indexA = playlist.songIds.indexOf(a.id)
        const indexB = playlist.songIds.indexOf(b.id)
        return indexA - indexB
      })

    return <PlaylistDetailClient playlist={playlist} songs={playlistSongs} />
  } catch (error) {
    console.error('Error loading playlist:', error)
    notFound()
  }
}
