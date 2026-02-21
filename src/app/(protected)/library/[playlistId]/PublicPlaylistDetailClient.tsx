'use client'

import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { useState, useCallback } from 'react'

interface PublicPlaylistDetailClientProps {
  playlist: Playlist
  songs: Song[]
  userId?: string
}

export default function PublicPlaylistDetailClient({
  playlist,
  songs,
  userId
}: PublicPlaylistDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [addingId, setAddingId] = useState<string | null>(null)

  const handleAddToLibrary = useCallback(
    async (song: Song) => {
      if (!userId) {
        router.push('/login?next=/library')
        return
      }

      try {
        setAddingId(song.id)
        await cloneSongAction(song.id)
        router.refresh()
      } catch (error) {
        console.error('Error cloning song:', error)
      } finally {
        setAddingId(null)
      }
    },
    [userId, router]
  )

  const handleStartPlaylist = () => {
    if (songs.length === 0) return

    if (typeof window !== 'undefined') {
      const songList = songs.map(s => s.id)
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: songs.map(s => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || ''
        }))
      }

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: `/library/${playlist.id}`,
        playlistContext
      }

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext')

      router.push(`/song/${songs[0].id}`)
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <button
              onClick={() => router.push('/library')}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label={t('common.back')}
            >
              <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <MusicalNoteIcon className="h-4 w-4" />
                <span>
                  {songs.length}{' '}
                  {songs.length === 1
                    ? (t('playlistView.songs') as string).slice(0, -1)
                    : t('playlistView.songs')}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartPlaylist}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95"
            >
              <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{t('playlistView.startPlaylist')}</span>
            </button>
          </div>
        </div>

        {songs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
            <MusicalNoteIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('playlistView.noSongsInPlaylist')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette playlist est vide.
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </div>

                  <div className="flex-shrink-0">
                    {song.songImageUrl ? (
                      <img
                        src={song.songImageUrl}
                        alt={song.title}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <MusicalNoteIcon className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/song/${song.id}`)}
                  >
                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                      {song.title}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {song.author}
                    </div>
                    {song.key && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {song.key}
                      </div>
                    )}
                  </div>

                  {userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToLibrary(song)
                      }}
                      disabled={addingId === song.id}
                      className="flex-shrink-0 p-2 rounded-md text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      aria-label="Add to library"
                    >
                      <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
