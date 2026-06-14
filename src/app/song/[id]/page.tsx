import { songMetadata } from '@/lib/seo/metadata'
import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { profileRepo } from '@/lib/services/profileRepo'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { updateSongAction, deleteSongAction } from './actions'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSafeServerClient()
  const song = await songRepo(supabase).getSongInfo(id)

  if (!song) {
    return { title: 'Song not found', robots: { index: false, follow: false } }
  }

  return songMetadata(song)
}

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
