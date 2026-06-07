'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import type { ForYouArtistSong } from '@/types/forYou'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop'

interface RecentSongsSectionProps {
  songs: ForYouArtistSong[]
  userId?: string
  limit?: number
}

export default function RecentSongsSection({ songs, userId, limit = 10 }: RecentSongsSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const handleAddToLibrary = useCallback(
    async (song: ForYouArtistSong) => {
      if (!userId) {
        router.push('/login?next=/search')
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
    },
    [userId, router]
  )

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
          const href =
            song.inUserLibrary && song.userSongId
              ? `/song/${song.userSongId}`
              : `/song/${song.id}`
          const isAdding = cloningId === song.id

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

                <div
                  className="flex shrink-0 items-center gap-1.5 border-l border-border/60 pl-2.5 sm:gap-1 sm:pl-2.5"
                >
                  <Button
                    asChild
                    size="icon"
                    className="rounded-lg h-11 w-12 sm:h-8 sm:w-8"
                    aria-label={t('search.viewSong')}
                  >
                    <Link href={href}>
                      <PlayIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </Link>
                  </Button>
                  {!song.inUserLibrary && (
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
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
