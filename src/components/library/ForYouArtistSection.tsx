'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import HorizontalSongSlider from '@/components/library/HorizontalSongSlider'
import { useLanguage } from '@/context/LanguageContext'
import type { ForYouArtistSong } from '@/types/forYou'

interface ForYouArtistSectionProps {
  artistName: string
  songs: ForYouArtistSong[]
  userId?: string
}

export default function ForYouArtistSection({
  artistName,
  songs,
  userId,
}: ForYouArtistSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const sectionTitle = useMemo(
    () => t('library.forYouArtist').replace('{artist}', artistName),
    [t, artistName]
  )

  const handleAddToLibrary = useCallback(
    async (song: ForYouArtistSong) => {
      if (!userId) {
        router.push('/login?next=/search')
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
    },
    [userId, router]
  )

  if (songs.length === 0) {
    return null
  }

  return (
    <HorizontalSongSlider
      title={sectionTitle}
      songs={songs}
      onAddClick={(song) => handleAddToLibrary(song as ForYouArtistSong)}
      addingId={cloningId}
      getLibraryStatus={(song) => {
        const forYouSong = song as ForYouArtistSong
        if (!forYouSong.inUserLibrary) return null
        return {
          label: t('library.inYourLibrary'),
          href: forYouSong.userSongId ? `/song/${forYouSong.userSongId}` : undefined,
          actionLabel: t('library.viewInLibrary'),
        }
      }}
    />
  )
}
