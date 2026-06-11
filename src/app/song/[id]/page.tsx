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
  const { id: songId } = await params

  const userPromise = supabase.auth.getUser()
  const songPromise = songRepo(supabase).getSong(songId)
  const preferredInstrumentPromise = userPromise.then(({ data: { user } }) =>
    user ? profileRepo(supabase).getPreferredInstrument(user.id) : Promise.resolve(null)
  )

  const [{ data: { user } }, song, preferredInstrument] = await Promise.all([
    userPromise,
    songPromise,
    preferredInstrumentPromise,
  ])

  if (!song) {
    redirect('/')
  }

  const isInLibrary = user ? song.userId === user.id : false
  const initialInstrument = preferredInstrument === 'guitar' ? 'guitar' : 'piano'

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
