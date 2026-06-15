'use client'

import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { BackArrowIcon } from '@/components/icons/DirectionalIcons'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { getPlaylistDisplayCoverUrl } from '@/utils/playlistCover'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import { useState, useCallback } from 'react'

interface PublicPlaylistDetailClientProps {
  playlist: Playlist
  songs: Song[]
  userId?: string
}

export default function PublicPlaylistDetailClient({
  playlist,
  songs,
  userId,
}: PublicPlaylistDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [addingId, setAddingId] = useState<string | null>(null)

  const coverUrl =
    getPlaylistDisplayCoverUrl(playlist) ??
    songs[0]?.songImageUrl ??
    songs[0]?.artistImageUrl ??
    null

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
      const songList = songs.map((s) => s.id)
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: songs.map((s) => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || '',
        })),
      }

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: `/library/${playlist.id}`,
        playlistContext,
      }

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext')

      router.push(`/song/${songs[0].id}`)
    }
  }

  const songCountLabel =
    songs.length === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songs.length} ${t('playlistView.songs')}`

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="relative h-80 w-full overflow-hidden sm:h-auto sm:aspect-[4/3] sm:max-h-[32rem]">
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
            <MusicalNoteIcon className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute start-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          aria-label={t('common.back')}
        >
          <BackArrowIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {playlist.name}
          </h1>
          <button
            type="button"
            onClick={handleStartPlaylist}
            disabled={songs.length === 0}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
            aria-label={t('playlistView.startPlaylist')}
          >
            <PlayIcon className="h-6 w-6 translate-x-0.5 sm:h-7 sm:w-7" />
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{songCountLabel}</p>
      </div>

      {songs.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <MusicalNoteIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-medium text-foreground">
            {t('playlistView.noSongsInPlaylist')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('playlistView.EMPTY_PLAYLIST_DESCRIPTION')}
          </p>
        </div>
      ) : (
        <ul className="mt-4">
          {songs.map((song) => {
            const isAdding = addingId === song.id

            return (
              <li key={song.id}>
                <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/song/${song.id}`)}
                    className="shrink-0"
                  >
                    <SongThumbnail
                      songImageUrl={song.songImageUrl}
                      artistImageUrl={song.artistImageUrl}
                      genre={song.genre}
                      alt={song.title}
                      size="xs"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/song/${song.id}`)}
                    className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
                  >
                    <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                    {song.author ? (
                      <p className="truncate text-xs text-muted-foreground">{song.author}</p>
                    ) : null}
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
                      onClick={() => handleAddToLibrary(song)}
                      disabled={isAdding || !userId}
                      aria-label={t('library.addToLibrary')}
                      title={t('library.addToLibrary')}
                    >
                      {isAdding ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => router.push(`/song/${song.id}`)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 sm:h-10 sm:w-10"
                      aria-label={t('search.viewSong')}
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
