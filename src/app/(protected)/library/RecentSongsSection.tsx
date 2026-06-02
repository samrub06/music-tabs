'use client'

import Link from 'next/link'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'
import type { Song } from '@/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop'

interface RecentSongsSectionProps {
  songs: Song[]
  limit?: number
}

export default function RecentSongsSection({ songs, limit = 10 }: RecentSongsSectionProps) {
  const { t } = useLanguage()

  if (songs.length === 0) {
    return null
  }

  const displaySongs = songs.slice(0, limit)

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          {t('library.recentlyAdded')}
        </h2>
        <Link
          href="/search/recent-songs"
          className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('library.viewAll')}
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {displaySongs.map((song) => {
          const imageUrl =
            song.songImageUrl || song.artistImageUrl || FALLBACK_IMAGE
          const href = `/song/${song.id}`

          return (
            <li key={song.id}>
              <div className="flex items-center gap-2.5 py-2">
                <Link
                  href={href}
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
                    href={href}
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

                <Link
                  href={href}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  aria-label={t('search.viewSong')}
                >
                  <PlayIcon className="h-5 w-5" aria-hidden />
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
