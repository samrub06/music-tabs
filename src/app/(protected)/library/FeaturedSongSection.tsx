import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import FeaturedSongCard from '@/components/library/FeaturedSongCard'
import FeaturedSongCardWrapper from './FeaturedSongCardWrapper'

interface FeaturedSongSectionProps {
  userId?: string
}

export default async function FeaturedSongSection({ userId }: FeaturedSongSectionProps) {
  const supabase = await createSafeServerClient()
  const repo = songRepo(supabase)
  
  // Fetch trending songs and get the first one as featured
  const trendingSongs = await repo.getTrendingSongs()
  const featuredSong = trendingSongs.length > 0 ? trendingSongs[0] : null

  if (!featuredSong) {
    return null
  }

  return <FeaturedSongCardWrapper song={featuredSong} userId={userId} />
}
