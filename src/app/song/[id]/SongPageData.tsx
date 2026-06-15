import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { updateSongAction, deleteSongAction } from './actions'
import { getCachedSong } from './loadSong'

interface SongPageDataProps {
  songId: string
}

export default async function SongPageData({ songId }: SongPageDataProps) {
  const supabase = await createSafeServerClient()

  const userPromise = supabase.auth.getUser()
  const songPromise = getCachedSong(songId)
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
