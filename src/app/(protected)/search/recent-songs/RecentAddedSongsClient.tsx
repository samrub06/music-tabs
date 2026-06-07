'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  ArrowLeftIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Song } from '@/types'

const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'

type ViewMode = 'list' | 'grid'

interface RecentAddedSongsClientProps {
  songs: Song[]
  userId?: string
}

interface SongItemProps {
  song: Song
  userId?: string
  cloningId: string | null
  onAddToLibrary: (song: Song) => void
}

function SongListItem({ song, userId, cloningId, onAddToLibrary }: SongItemProps) {
  const { t } = useLanguage()
  const imageUrl = song.songImageUrl || song.artistImageUrl || FALLBACK_IMAGE_URL
  const isAdding = cloningId === song.id

  return (
    <div className="flex items-center gap-3 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-muted/30 transition-all">
      <Link href={`/song/${song.id}`} className="flex-shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-muted">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </Link>
      <Link href={`/song/${song.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{song.author}</p>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-lg h-8 w-8"
          onClick={() => onAddToLibrary(song)}
          disabled={isAdding || !userId}
          aria-label={t('common.create')}
        >
          {isAdding ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
          ) : (
            <PlusIcon className="h-3.5 w-3.5" />
          )}
        </Button>
        <Link
          href={`/song/${song.id}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          aria-label={t('search.viewSong')}
        >
          <PlayIcon className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

function SongGridItem({ song, userId, cloningId, onAddToLibrary }: SongItemProps) {
  const { t } = useLanguage()
  const imageUrl = song.songImageUrl || song.artistImageUrl || FALLBACK_IMAGE_URL
  const isAdding = cloningId === song.id

  return (
    <div className="group">
      <Link href={`/song/${song.id}`}>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
          <img src={imageUrl} alt={song.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <PlayIcon className="h-5 w-5 text-primary-foreground ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
      <Link href={`/song/${song.id}`}>
        <h3 className="font-semibold text-foreground text-sm truncate hover:underline">{song.title}</h3>
      </Link>
      <p className="text-xs text-muted-foreground truncate mb-2">{song.author}</p>
      <Button
        variant="secondary"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={() => onAddToLibrary(song)}
        disabled={isAdding || !userId}
      >
        {isAdding ? (
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
        ) : (
          <>
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            {t('common.create')}
          </>
        )}
      </Button>
    </div>
  )
}

export default function RecentAddedSongsClient({ songs, userId }: RecentAddedSongsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleAddToLibrary = useCallback(async (song: Song) => {
    if (!userId) {
      router.push('/login?next=/search/recent-songs')
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
  }, [userId, router])

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-6 pb-24 sm:p-6 lg:px-0 lg:py-8 lg:pb-10"
      >
      <div className="mx-auto max-w-7xl lg:mx-0 lg:max-w-none">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-lg">
              <Link href="/" aria-label={t('common.back')}>
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {t('library.recentlyAdded')}
            </h1>
          </div>

          {songs.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-muted/80 p-0.5 shrink-0">
              <button
                type="button"
                className={cn(
                  'min-h-9 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setViewMode('list')}
                title={t('library.listView')}
              >
                <ListBulletIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('library.listView')}</span>
              </button>
              <button
                type="button"
                className={cn(
                  'min-h-9 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setViewMode('grid')}
                title={t('library.gridView')}
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('library.gridView')}</span>
              </button>
            </div>
          )}
        </div>

        {songs.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-1.5">
              {songs.map((song) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  userId={userId}
                  cloningId={cloningId}
                  onAddToLibrary={handleAddToLibrary}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {songs.map((song) => (
                <SongGridItem
                  key={song.id}
                  song={song}
                  userId={userId}
                  cloningId={cloningId}
                  onAddToLibrary={handleAddToLibrary}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 rounded-2xl bg-card border border-border">
            <p className="text-muted-foreground">{t('library.noRecentlyAdded')}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
