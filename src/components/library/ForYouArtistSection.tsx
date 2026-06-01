'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { useLanguage } from '@/context/LanguageContext'
import type { ForYouArtistSong } from '@/types/forYou'

interface ForYouArtistSectionProps {
  artistName: string
  songs: ForYouArtistSong[]
  userId?: string
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop'

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

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl">{sectionTitle}</h2>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-lg">
        {songs.map((song) => {
          const imageUrl =
            song.songImageUrl || song.artistImageUrl || FALLBACK_IMAGE
          const href = song.inUserLibrary && song.userSongId
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
                </div>

                <div className="shrink-0">
                  {song.inUserLibrary ? (
                    <Link
                      href={href}
                      className="inline-flex min-h-8 items-center text-[11px] font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      {t('library.seeSong')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToLibrary(song)}
                      disabled={isAdding || !userId}
                      className="inline-flex min-h-8 items-center text-[11px] font-medium text-green-600 transition-colors hover:text-green-700 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                    >
                      {isAdding ? t('library.adding') : t('library.addToLibrary')}
                    </button>
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
