import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import SearchClient from './SearchClient'
import { unstable_noStore as noStore } from 'next/cache'

export default async function SearchPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch data for Library sections
  const repo = songRepo(supabase)
  
  // Featured song: first trending song
  const trendingSongs = await repo.getTrendingSongs()
  const featuredSong = trendingSongs.length > 0 ? trendingSongs[0] : null

  // Recent songs: latest 15 songs
  const recentSongs = await repo.getRecentSongs(15)

  // Popular songs: top 15 by view count
  const popularSongs = await repo.getPopularSongs(15)

  return (
    <SearchClient
      featuredSong={featuredSong}
      recentSongs={recentSongs}
      popularSongs={popularSongs}
      userId={user?.id}
    />
  )
}
