import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { unstable_noStore as noStore } from 'next/cache'
import RecentAddedSongsClient from './RecentAddedSongsClient'

export default async function RecentAddedSongsPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const songs = await songRepo(supabase).getRecentSongsLightweight(50)

  return <RecentAddedSongsClient songs={songs} userId={user?.id} />
}
