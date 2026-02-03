import type { Song } from '@/types'
import HorizontalSliderWrapper from './HorizontalSliderWrapper'

interface PopularSongsSectionProps {
  songs: Song[]
  userId?: string
}

export default function PopularSongsSection({ songs, userId }: PopularSongsSectionProps) {
  if (songs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title="Chansons les plus écoutées"
      songs={songs}
      userId={userId}
    />
  )
}
