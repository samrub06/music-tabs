'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackArrowIcon } from '@/components/icons/DirectionalIcons'
import { useLanguage } from '@/context/LanguageContext'
import {
  addSongFromSearchAction,
  getSongForPreviewFromSearchAction,
} from '@/app/(protected)/search/actions'
import type { Song } from '@/types'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'

// Mock actions for preview mode (catalog song may not be in user library yet)
const mockUpdateAction = async () => {
  throw new Error('Cannot update song in preview mode. Add to library first.')
}

const mockDeleteAction = async () => {
  throw new Error('Cannot delete song in preview mode. Add to library first.')
}

interface SongPreviewClientProps {
  url: string
  searchResult?: string
  userId?: string
}

export default function SongPreviewClient({
  url,
  searchResult: searchResultParam,
  userId,
}: SongPreviewClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [song, setSong] = useState<Song | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const searchResult = searchResultParam
          ? JSON.parse(decodeURIComponent(searchResultParam))
          : null

        const { song: catalogSong } = await getSongForPreviewFromSearchAction({
          url,
          title: searchResult?.title,
          author: searchResult?.author,
          source: searchResult?.sourceSite || searchResult?.source,
          tabId: searchResult?.tabId,
          reviews: searchResult?.reviews,
          version: searchResult?.version,
          rating: searchResult?.rating,
          difficulty: searchResult?.difficulty,
          versionDescription: searchResult?.versionDescription,
          artistUrl: searchResult?.artistUrl,
          artistImageUrl: searchResult?.artistImageUrl,
          songImageUrl: searchResult?.songImageUrl,
        })

        setSong(catalogSong)
      } catch (err) {
        console.error('Error fetching song:', err)
        setError(
          err instanceof Error ? err.message : t('songPreview.FETCH_ERROR_GENERIC')
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchSong()
  }, [url, searchResultParam, t])

  const handleAddToLibrary = async () => {
    if (!userId || !song) {
      router.push('/login?next=/song/preview')
      return
    }

    try {
      const { song: newSong } = await addSongFromSearchAction({
        url: song.sourceUrl || url,
        title: song.title,
        author: song.author,
        source: song.sourceSite,
        tabId: song.tabId,
        reviews: song.reviews,
        version: song.version,
        rating: song.rating,
        difficulty: song.difficulty,
        versionDescription: song.versionDescription,
        artistUrl: song.artistUrl,
        artistImageUrl: song.artistImageUrl,
        songImageUrl: song.songImageUrl,
      })
      router.push(`/song/${newSong.id}`)
    } catch (err) {
      console.error('Error adding song:', err)
      setError(err instanceof Error ? err.message : t('songPreview.ADD_ERROR'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{t('songPreview.LOADING')}</p>
        </div>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md p-6 text-center">
          <p className="mb-4 text-destructive">
            {error || t('songPreview.NOT_FOUND')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BackArrowIcon className="h-4 w-4" />
            {t('songPreview.BACK_TO_SEARCH')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SongViewerContainerSSR
        song={song}
        onUpdate={mockUpdateAction}
        onDelete={mockDeleteAction}
        isAuthenticated={!!userId}
        isInLibrary={false}
        canEdit={false}
        onAddToLibrary={handleAddToLibrary}
      />
    </div>
  )
}
