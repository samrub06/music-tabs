'use client'

import { useLanguage } from '@/context/LanguageContext'
import HorizontalSliderWrapper from './HorizontalSliderWrapper'
import type { Song } from '@/types'

interface PopularSongsSectionProps {
  songs: Song[]
  userId?: string
}

export default function PopularSongsSection({ songs, userId }: PopularSongsSectionProps) {
  const { t } = useLanguage()

  if (songs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title={t('library.mostPlayed')}
      songs={songs}
      userId={userId}
    />
  )
}
