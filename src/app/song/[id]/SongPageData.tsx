import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { updateSongAction, deleteSongAction } from './actions'
import { getCachedSong } from './loadSong'
import { songRepo } from '@/lib/services/songRepo'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import { canEditSong } from '@/lib/utils/songEditPermissions'

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

  const isOwnedByUser = user ? song.userId === user.id : false
  let librarySongId: string | undefined

  if (user && !isOwnedByUser) {
    const userSongs = await songRepo(supabase).getAllSongsLightweight()
    librarySongId = findUserSongMatch(song, userSongs)?.id
  }

  const isAdmin = user ? await profileRepo(supabase).isAdmin(user.id) : false
  const canEdit = canEditSong(song, { userId: user?.id, isAdmin })
  const isInLibrary = isOwnedByUser || Boolean(librarySongId)
  const initialInstrument = preferredInstrument === 'guitar' ? 'guitar' : 'piano'

  return (
    <SongViewerContainerSSR
      song={song}
      onUpdate={updateSongAction}
      onDelete={deleteSongAction}
      isAuthenticated={!!user}
      isInLibrary={isInLibrary}
      isOwnedByUser={isOwnedByUser}
      librarySongId={librarySongId}
      canEdit={canEdit}
      initialInstrument={initialInstrument}
    />
  )
}
