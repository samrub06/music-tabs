'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import type { ForYouArtistSong } from '@/types/forYou'

interface ForYouArtistSectionProps {
  artistName: string
  songs: ForYouArtistSong[]
  userId?: string
}

export default function ForYouArtistSection({
  artistName,
  songs,
  userId,
}: ForYouArtistSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [cloningId, setCloningId] = useState<string | null>(null)

  const sectionTitle = useMemo(
    () => t('library.forYouArtist').replace('{artist}', artistName),
    [t, artistName]
  )

  const handleAddToLibrary = useCallback(
    async (song: ForYouArtistSong) => {
      if (!userId) {
        router.push('/login?next=/')
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

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl">{sectionTitle}</h2>
      <ul className="space-y-1.5">
        {songs.map((song) => {
          const href = song.inUserLibrary && song.userSongId
            ? `/song/${song.userSongId}`
            : `/song/${song.id}`
          const isAdding = cloningId === song.id

          return (
            <li key={song.id}>
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-2.5 py-2 transition-colors hover:bg-gray-100 dark:bg-muted/30 dark:hover:bg-muted/50 sm:px-3 sm:py-2.5">
                <Link
                  href={href}
                  className="block h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  <SongThumbnail
                    songImageUrl={song.songImageUrl}
                    artistImageUrl={song.artistImageUrl}
                    genre={song.genre}
                    alt={song.title}
                    size="sm"
                    className="h-full w-full rounded-md"
                  />
                </Link>

                <div className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}>
                  <Link
                    href={href}
                    className="block truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {song.title}
                  </Link>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-1">
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
                  <Link
                    href={href}
                    className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:text-primary/80 sm:h-8 sm:w-8"
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
    </section>
  )
}
