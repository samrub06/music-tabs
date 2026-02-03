'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import type { NewSongData, Song } from '@/types'
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR'
import { parseTextToStructuredSong } from '@/utils/songParser'
// Mock actions for preview mode (song is not in database yet)
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
  userId
}: SongPreviewClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [song, setSong] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const searchResult = searchResultParam ? JSON.parse(decodeURIComponent(searchResultParam)) : null
        const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}&searchResult=${encodeURIComponent(JSON.stringify(searchResult || {}))}`)
        const data = await response.json()

        if (response.ok && data.song) {
          // Build song object from scraped data
          const scraped = data.song
          const searchResultData = searchResult || {}

          const title = (scraped.title || searchResultData.title || 'Unknown title').trim()
          const author = (scraped.author || searchResultData.author || 'Unknown artist').trim()
          const content = scraped.content || ''

          // Parse content to structured format with sections
          const structuredSong = parseTextToStructuredSong(
            title,
            author,
            content,
            undefined, // folderId
            (searchResultData.reviews ?? scraped.reviews) || 0,
            scraped.capo,
            scraped.key
          )

          // Build complete song object
          const songData: Song = {
            ...structuredSong,
            id: `preview-${Date.now()}`, // Temporary ID for preview
            rating: scraped.rating || searchResultData.rating,
            difficulty: scraped.difficulty || searchResultData.difficulty,
            version: scraped.version || searchResultData.version,
            versionDescription: scraped.versionDescription || searchResultData.versionDescription,
            bpm: scraped.bpm,
            sourceUrl: url,
            sourceSite: searchResultData.sourceSite || searchResultData.source,
            tabId: searchResultData.tabId,
            genre: scraped.genre,
            decade: scraped.decade,
            allChords: scraped.allChords || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            folderId: undefined,
            userId: userId || undefined
          }

          setSong(songData)
        } else {
          setError(data.error || 'Unable to retrieve the song.')
        }
      } catch (err) {
        console.error('Error fetching song:', err)
        setError(err instanceof Error ? err.message : 'Error retrieving the song.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSong()
  }, [url, searchResultParam, userId])

  const handleAddToLibrary = async () => {
    if (!userId || !song) {
      router.push('/login?next=/song/preview')
      return
    }

    setIsAdding(true)
    try {
      const payload: NewSongData = {
        title: song.title.trim(),
        author: song.author.trim(),
        content: song.content.trim(),
        reviews: song.reviews || 0,
        capo: song.capo,
        key: song.key,
        rating: song.rating,
        difficulty: song.difficulty,
        version: song.version,
        versionDescription: song.versionDescription,
        bpm: song.bpm,
        sourceUrl: song.sourceUrl,
        sourceSite: song.sourceSite,
        tabId: song.tabId,
        genre: song.genre
      }

      const newSong = await addSongAction(payload)
      router.push(`/song/${newSong.id}`)
    } catch (err) {
      console.error('Error adding song:', err)
      setError(err instanceof Error ? err.message : 'Error adding song to library.')
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading song...</p>
        </div>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Song not found'}</p>
          <button
            onClick={() => router.push('/search')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Preview Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Preview mode - This song is not in your library
          </p>
          {userId && (
            <button
              onClick={handleAddToLibrary}
              disabled={isAdding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                'Add to Library'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Song Viewer */}
      <SongViewerContainerSSR
        song={song}
        onUpdate={mockUpdateAction}
        onDelete={mockDeleteAction}
        isAuthenticated={!!userId}
        isInLibrary={false}
        onAddToLibrary={handleAddToLibrary}
      />
    </div>
  )
}
