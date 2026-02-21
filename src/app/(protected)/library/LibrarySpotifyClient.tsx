'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/types'
import LibraryGridSection, { type PublicPlaylistItem } from '@/components/library/LibraryGridSection'
import FeaturedSongCard from '@/components/library/FeaturedSongCard'
import HorizontalSongSlider from '@/components/library/HorizontalSongSlider'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'

interface LibrarySpotifyClientProps {
  featuredSong: Song | null
  recentSongs: Song[]
  popularSongs: Song[]
  publicPlaylists: PublicPlaylistItem[]
  showLikedCard?: boolean
  userId?: string
}

export default function LibrarySpotifyClient({
  featuredSong,
  recentSongs,
  popularSongs,
  publicPlaylists,
  showLikedCard = true,
  userId
}: LibrarySpotifyClientProps) {
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const handleAddToLibrary = useCallback(async (song: Song) => {
    // If not logged in, redirect to login
    if (!userId) {
      router.push('/login?next=/library')
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
    <div className="p-4 sm:p-6 lg:px-6 lg:py-8 overflow-y-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto lg:max-w-none lg:mx-0">
        {/* Section 1: Grille de 8 cards */}
        <LibraryGridSection
          publicPlaylists={publicPlaylists}
          showLikedCard={showLikedCard}
        />

        {/* Section 2: Featured Song */}
        {featuredSong && (
          <FeaturedSongCard
            song={featuredSong}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
          />
        )}

        {/* Section 3: Dernières chansons ajoutées */}
        {recentSongs.length > 0 && (
          <HorizontalSongSlider
            title="Dernières chansons ajoutées"
            songs={recentSongs}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
          />
        )}

        {/* Section 4: Chansons les plus écoutées */}
        {popularSongs.length > 0 && (
          <HorizontalSongSlider
            title="Chansons les plus écoutées"
            songs={popularSongs}
            onAddClick={handleAddToLibrary}
            addingId={cloningId}
          />
        )}
      </div>
    </div>
  )
}
