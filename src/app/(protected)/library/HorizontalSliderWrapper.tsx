'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import HorizontalSongSlider from '@/components/library/HorizontalSongSlider'
import type { Song } from '@/types'

interface HorizontalSliderWrapperProps {
  title: string
  songs: Song[]
  userId?: string
}

export default function HorizontalSliderWrapper({ title, songs, userId }: HorizontalSliderWrapperProps) {
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const handleAddToLibrary = useCallback(async (song: Song) => {
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
    <HorizontalSongSlider
      title={title}
      songs={songs}
      onAddClick={handleAddToLibrary}
      addingId={cloningId}
    />
  )
}
