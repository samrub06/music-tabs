import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import HorizontalSliderWrapper from '../library/HorizontalSliderWrapper'

interface RecentSongsSectionProps {
  userId?: string
}

export default async function RecentSongsSection({ userId }: RecentSongsSectionProps) {
  const supabase = await createSafeServerClient()
  const repo = songRepo(supabase)
  
  // Fetch recent songs
  const recentSongs = await repo.getRecentSongs(15)

  if (recentSongs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title="Dernières chansons ajoutées"
      songs={recentSongs}
      userId={userId}
    />
  )
}
