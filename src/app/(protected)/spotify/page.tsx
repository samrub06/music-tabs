import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import { folderRepo } from '@/lib/services/folderRepo'
import { getSpotifyConfig } from '@/lib/config/spotify'
import SpotifyImportClient from './SpotifyImportClient'

export default async function SpotifyImportPage() {
  noStore()

  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?next=/spotify')
  }

  const [spotifyId, folders] = await Promise.all([
    profileRepo(supabase).getSpotifyId(user.id),
    folderRepo(supabase).getAllFolders(),
  ])

  return (
    <Suspense fallback={null}>
      <SpotifyImportClient
        isConfigured={!!getSpotifyConfig()}
        isConnected={!!spotifyId}
        folders={folders}
      />
    </Suspense>
  )
}
