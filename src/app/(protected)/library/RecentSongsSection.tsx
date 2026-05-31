'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { Song } from '@/types'
import HorizontalSliderWrapper from './HorizontalSliderWrapper'

interface RecentSongsSectionProps {
  songs: Song[]
  userId?: string
}

export default function RecentSongsSection({ songs, userId }: RecentSongsSectionProps) {
  const { t } = useLanguage()

  if (songs.length === 0) {
    return null
  }

  return (
    <HorizontalSliderWrapper
      title={t('library.recentlyAdded')}
      songs={songs}
      userId={userId}
      viewAllHref="/search/recent-songs"
      viewAllLabel={t('library.viewAll')}
    />
  )
}
