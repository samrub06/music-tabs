import type { Song } from '@/types'
import HorizontalSliderWrapper from './HorizontalSliderWrapper'

interface RecentSongsSectionProps {
  songs: Song[]
  userId?: string
}

export default function RecentSongsSection({ songs, userId }: RecentSongsSectionProps) {
  if (songs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title="Dernières chansons ajoutées"
      songs={songs}
      userId={userId}
    />
  )
}
