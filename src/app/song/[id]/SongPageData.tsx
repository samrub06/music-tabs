import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { updateSongAction, deleteSongAction } from './actions'
import { getCachedSong } from './loadSong'
import { songRepo } from '@/lib/services/songRepo'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import { canEditSong } from '@/lib/utils/songEditPermissions'
import { SongSeoContent } from '@/components/presentational/SongSeoContent'
import { SongSeoGate } from '@/components/seo/SongSeoGate'
import Link from 'next/link'
import { artistPath } from '@/lib/seo/songPath'
import { artistSlugFromAuthor } from '@/utils/slugify'

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
  const practiceCoachDonePromise = userPromise.then(({ data: { user } }) =>
    user ? profileRepo(supabase).hasCompletedPracticeCoach(user.id) : Promise.resolve(false)
  )

  const [{ data: { user } }, song, preferredInstrument, practiceCoachCompleted] = await Promise.all([
    userPromise,
    songPromise,
    preferredInstrumentPromise,
    practiceCoachDonePromise,
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
  const indexable = !song.userId
  const authorSlug = artistSlugFromAuthor(song.author)

  return (
    <>
      {indexable ? (
        <SongSeoGate>
          <SongSeoContent song={song} />
          <p>
            <Link href={artistPath(authorSlug)}>{song.author}</Link>
          </p>
        </SongSeoGate>
      ) : null}
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
        practiceCoachCompleted={practiceCoachCompleted}
      />
    </>
  )
}
