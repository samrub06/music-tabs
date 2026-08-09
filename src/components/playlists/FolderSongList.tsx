'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PlayIcon } from '@heroicons/react/24/outline'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { useLanguage } from '@/context/LanguageContext'
import { songPath } from '@/lib/seo/songPath'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import type { Song } from '@/types'

function storeFolderSongNavigation(songs: Song[], song: Song, sourceUrl: string) {
  if (typeof window === 'undefined') return
  const songList = songs.map((s) => s.id)
  const currentIndex = songs.findIndex((s) => s.id === song.id)
  sessionStorage.setItem(
    'songNavigation',
    JSON.stringify({
      songList,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      sourceUrl,
      playlistContext: {
        isPlaylist: true,
        songs: songs.map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author,
          songImageUrl: s.songImageUrl,
          artistImageUrl: s.artistImageUrl,
        })),
      },
    })
  )
  sessionStorage.removeItem('hasUsedNext')
}

interface FolderSongListProps {
  songs: Song[]
  className?: string
}

/** Spotify-style song rows for a personal playlist/folder. */
export function FolderSongList({ songs, className }: FolderSongListProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  const navigateToSong = useCallback(
    (song: Song) => {
      storeFolderSongNavigation(songs, song, pathname || `/playlists`)
      router.push(songPath(song))
    },
    [songs, pathname, router]
  )

  return (
    <ul className={cn(className)}>
      {songs.map((song) => (
        <li key={song.id}>
          <div className="flex items-center gap-3 px-0.5 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3">
            <button
              type="button"
              onClick={() => navigateToSong(song)}
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
              onClick={() => navigateToSong(song)}
              className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
            >
              <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
              {song.author ? (
                <p className="truncate text-xs text-muted-foreground">{song.author}</p>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => navigateToSong(song)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 sm:h-10 sm:w-10"
              aria-label={t('search.viewSong')}
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
