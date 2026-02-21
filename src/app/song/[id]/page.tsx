import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { profileRepo } from '@/lib/services/profileRepo'
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

  // Load song and user in parallel
  const songRepoInstance = songRepo(supabase)
  const [song, { data: { user } }] = await Promise.all([
    songRepoInstance.getSong(songId),
    supabase.auth.getUser()
  ])

  if (!song) {
    redirect('/search')
  }

  // Check if song is in user's library (song belongs to user)
  const isInLibrary = user ? song.userId === user.id : false

  // Fetch profile for preferred instrument when authenticated
  const profile = user ? await profileRepo(supabase).getProfile(user.id) : null
  const initialInstrument = profile?.preferredInstrument === 'guitar' ? 'guitar' : 'piano'

  return (
    <SongViewerContainerSSR 
      song={song} 
      onUpdate={updateSongAction}
      onDelete={deleteSongAction}
      isAuthenticated={!!user}
      isInLibrary={isInLibrary}
      initialInstrument={initialInstrument}
    />
  )
}
