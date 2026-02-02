import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import HorizontalSliderWrapper from '../library/HorizontalSliderWrapper'

interface PopularSongsSectionProps {
  userId?: string
}

export default async function PopularSongsSection({ userId }: PopularSongsSectionProps) {
  const supabase = await createSafeServerClient()
  const repo = songRepo(supabase)
  
  // Fetch popular songs
  const popularSongs = await repo.getPopularSongs(15)

  if (popularSongs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title="Chansons les plus écoutées"
      songs={popularSongs}
      userId={userId}
    />
  )
}
