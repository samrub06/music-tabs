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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('songPreview.LOADING')}</p>
        </div>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || t('songPreview.NOT_FOUND')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BackArrowIcon className="h-4 w-4" />
            {t('songPreview.BACK_TO_SEARCH')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
