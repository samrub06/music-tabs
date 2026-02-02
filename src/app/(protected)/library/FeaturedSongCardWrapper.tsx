'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import FeaturedSongCard from '@/components/library/FeaturedSongCard'
import type { Song } from '@/types'

interface FeaturedSongCardWrapperProps {
  song: Song
  userId?: string
}

export default function FeaturedSongCardWrapper({ song, userId }: FeaturedSongCardWrapperProps) {
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
    <FeaturedSongCard
      song={song}
      onAddClick={handleAddToLibrary}
      addingId={cloningId}
    />
  )
}
