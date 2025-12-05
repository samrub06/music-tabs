import { createServerClientSupabase } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import ExploreClient from './ExploreClient'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch trending songs
  const trendingSongs = await songRepo(supabase).getTrendingSongs()

  return (
    <ExploreClient 
      initialSongs={trendingSongs}
      userId={user?.id}
    />
  )
}

