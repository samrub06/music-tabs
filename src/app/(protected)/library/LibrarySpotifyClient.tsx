'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/types'
import { useLanguage } from '@/context/LanguageContext'
import LibraryGridSection, { type PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import FeaturedSongCard from '@/components/library/FeaturedSongCard'
import HorizontalSongSlider from '@/components/library/HorizontalSongSlider'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'

interface LibrarySpotifyClientProps {
  featuredSong: Song | null
  recentSongs: Song[]
  popularSongs: Song[]
  publicPlaylists: PublicPlaylistItem[]
  showUserShortcutCards?: boolean
  userId?: string
}

export default function LibrarySpotifyClient({
  featuredSong,
  recentSongs,
  popularSongs,
  publicPlaylists,
  showUserShortcutCards = true,
  userId
}: LibrarySpotifyClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const handleAddToLibrary = useCallback(async (song: Song) => {
    // If not logged in, redirect to login
    if (!userId) {
      router.push('/login?next=/')
      return
    }

    try {
      setCloningId(song.id)
      await cloneSongAction(song.id)
      router.refresh()
    } catch (error) {
      console.error('Error cloning song:', error)
    } finally {
      setCloningId(null)
    }
  }, [userId, router])

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:px-6 lg:py-8"
      >
      <div className="mx-auto max-w-7xl lg:mx-0 lg:max-w-none">
        {/* Section 1: Grille de 8 cards */}
        <LibraryGridSection
          publicPlaylists={publicPlaylists}
          showUserShortcutCards={showUserShortcutCards}
        />

        {/* Section 2: Featured Song */}
        {featuredSong && (
          <FeaturedSongCard
            song={featuredSong}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
          />
        )}

        {recentSongs.length > 0 && (
          <HorizontalSongSlider
            title={t('library.recentlyAdded')}
            songs={recentSongs}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
            viewAllHref="/search/recent-songs"
            viewAllLabel={t('library.viewAll')}
          />
        )}

        {popularSongs.length > 0 && (
          <HorizontalSongSlider
            title={t('library.mostPlayed')}
            songs={popularSongs}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
          />
        )}
      </div>
      </div>
    </div>
  )
}
