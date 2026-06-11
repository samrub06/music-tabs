'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MusicalNoteIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { useState, useCallback } from 'react'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop'

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
        router.push('/login?next=/')
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
              onClick={() => router.push('/')}
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
              {t('playlistView.EMPTY_PLAYLIST_DESCRIPTION')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {songs.map((song) => {
              const imageUrl =
                song.songImageUrl || song.artistImageUrl || FALLBACK_IMAGE
              const isAdding = addingId === song.id

              return (
                <li key={song.id}>
                  <div className="flex items-center gap-2.5 py-2">
                    <Link
                      href={`/song/${song.id}`}
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/song/${song.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {song.title}
                      </Link>
                      {song.author ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {song.author}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-lg h-11 w-11 sm:h-8 sm:w-8"
                        onClick={() => handleAddToLibrary(song)}
                        disabled={isAdding || !userId}
                        aria-label={t('library.addToLibrary')}
                        title={t('library.addToLibrary')}
                      >
                        {isAdding ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent sm:h-3.5 sm:w-3.5" />
                        ) : (
                          <PlusIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        )}
                      </Button>
                      <Link
                        href={`/song/${song.id}`}
                        className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-lg text-green-600 transition-colors hover:text-green-700 sm:h-8 sm:w-8 dark:text-green-400 dark:hover:text-green-300"
                        aria-label={t('search.viewSong')}
                      >
                        <PlayIcon className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
