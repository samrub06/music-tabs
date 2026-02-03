import type { Song } from '@/types'
import FeaturedSongCardWrapper from './FeaturedSongCardWrapper'

interface FeaturedSongSectionProps {
  featuredSong: Song | null
  userId?: string
}

export default function FeaturedSongSection({ featuredSong, userId }: FeaturedSongSectionProps) {
  if (!featuredSong) {
    return null
  }

  return <FeaturedSongCardWrapper song={featuredSong} userId={userId} />
}
