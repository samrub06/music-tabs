import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { updateSongAction, deleteSongAction } from './actions'

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createSafeServerClient()
  const { id } = await params
  const songId = id

  // Load song from database
  const repo = songRepo(supabase)
  const song = await repo.getSong(songId)
  const { data: { user } } = await supabase.auth.getUser()

  if (!song) {
    redirect('/library')
  }

  return (
    <SongViewerContainerSSR 
      song={song} 
      onUpdate={updateSongAction}
      onDelete={deleteSongAction}
      isAuthenticated={!!user}
    />
  )
}
