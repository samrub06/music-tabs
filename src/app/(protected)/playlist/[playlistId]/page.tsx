import { createSafeServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import PlaylistSongsData from './PlaylistSongsData'
import PlaylistSongsSkeleton from './PlaylistSongsSkeleton'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

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

    return (
      <Suspense fallback={<PlaylistSongsSkeleton />}>
        <PlaylistSongsData playlist={playlist} />
      </Suspense>
    )
  } catch (error) {
    console.error('Error loading playlist:', error)
    notFound()
  }
}
