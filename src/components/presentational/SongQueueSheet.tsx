'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'

interface SongQueueItem {
  id: string
  title: string
  author?: string
  songImageUrl?: string
  artistImageUrl?: string
}

interface PlaylistNavSong {
  id: string
  title?: string
  author?: string
  songImageUrl?: string
  artistImageUrl?: string
}

interface SongNavigationData {
  songList: string[]
  currentIndex: number
  sourceUrl?: string
  playlistContext?: {
    isPlaylist?: boolean
    songs?: PlaylistNavSong[]
  }
}

interface SongQueueSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSongId: string
}

function readNavigationData(): SongNavigationData | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem('songNavigation')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SongNavigationData
    if (!Array.isArray(parsed.songList) || parsed.songList.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

function playlistRowsFromNav(nav: SongNavigationData): SongQueueItem[] | null {
  const context = nav.playlistContext
  if (!context?.isPlaylist || !Array.isArray(context.songs) || context.songs.length === 0) {
    return null
  }

  const byId = new Map(context.songs.map((song) => [song.id, song]))
  const hasTitles = context.songs.some((song) => Boolean(song.title?.trim()))
  if (!hasTitles) return null

  const rows: SongQueueItem[] = []
  for (const id of nav.songList) {
    const song = byId.get(id)
    if (!song) continue
    const title = song.title?.trim()
    if (!title) continue
    rows.push({
      id,
      title,
      author: song.author,
      songImageUrl: song.songImageUrl,
      artistImageUrl: song.artistImageUrl,
    })
  }

  return rows.length > 0 ? rows : null
}

export default function SongQueueSheet({
  open,
  onOpenChange,
  currentSongId,
}: SongQueueSheetProps) {
  const { t, isRtl } = useLanguage()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [items, setItems] = useState<SongQueueItem[]>([])
  const [isPlaylist, setIsPlaylist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadQueue() {
      setLoading(true)
      setEmpty(false)

      const nav = readNavigationData()
      if (!nav) {
        if (!cancelled) {
          setItems([])
          setIsPlaylist(false)
          setEmpty(true)
          setLoading(false)
        }
        return
      }

      const fromPlaylist = playlistRowsFromNav(nav)
      if (fromPlaylist && fromPlaylist.length > 0) {
        if (!cancelled) {
          setItems(fromPlaylist)
          setIsPlaylist(true)
          setEmpty(false)
          setLoading(false)
        }
        return
      }

      try {
        const repo = songRepo(supabase)
        const songs = await repo.getSongsByIdsForPublicPlaylist(nav.songList)
        if (cancelled) return

        const rows: SongQueueItem[] = songs.map((song) => ({
          id: song.id,
          title: song.title,
          author: song.author,
          songImageUrl: song.songImageUrl,
          artistImageUrl: song.artistImageUrl,
        }))

        setItems(rows)
        setIsPlaylist(Boolean(nav.playlistContext?.isPlaylist))
        setEmpty(rows.length === 0)
      } catch (error) {
        console.error('Failed to load song queue:', error)
        if (!cancelled) {
          setItems([])
          setIsPlaylist(false)
          setEmpty(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadQueue()

    return () => {
      cancelled = true
    }
  }, [open, supabase])

  const handleSelectSong = (songId: string) => {
    if (typeof window !== 'undefined') {
      const nav = readNavigationData()
      if (nav) {
        const currentIndex = nav.songList.indexOf(songId)
        sessionStorage.setItem(
          'songNavigation',
          JSON.stringify({
            ...nav,
            currentIndex: currentIndex >= 0 ? currentIndex : nav.currentIndex,
          })
        )
        sessionStorage.removeItem('hasUsedNext')
      }
    }

    onOpenChange(false)
    if (songId !== currentSongId) {
      router.push(`/song/${songId}`)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-black/35 dark:bg-black/50"
        className={cn(
          '!bottom-0 z-[60] flex h-auto max-h-[min(48vh,420px)] flex-col gap-0 overflow-hidden',
          'rounded-t-[1.75rem] border border-b-0 border-black/[0.06] bg-background/95 p-0',
          'shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl',
          'dark:border-white/[0.08] dark:bg-background/98 dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]'
        )}
      >
        <div className="flex shrink-0 items-center px-4 py-1.5">
          <div className="flex-1" aria-hidden />
          <div className="h-1 w-14 shrink-0 touch-none rounded-full bg-muted-foreground/25" />
          <div className="flex flex-1 justify-end">
            <SheetClose className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </SheetClose>
          </div>
        </div>

        <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start sm:text-start">
          <SheetTitle className="text-xl font-semibold">
            {isPlaylist
              ? t('songHeader.songQueuePlaylistTitle')
              : t('songHeader.songQueueSongsTitle')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t('songHeader.songQueueLoading')}
            </div>
          ) : empty || items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t('songHeader.songQueueEmpty')}
            </div>
          ) : (
            <ul
              className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-2"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {items.map((song, index) => {
                const isCurrent = song.id === currentSongId
                return (
                  <li key={`${song.id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectSong(song.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition-colors duration-200',
                        isCurrent
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-muted/70 active:bg-muted'
                      )}
                    >
                      <SongThumbnail
                        songImageUrl={song.songImageUrl}
                        artistImageUrl={song.artistImageUrl}
                        alt={song.title}
                        size="sm"
                        className="h-11 w-11 shrink-0 rounded-lg"
                      />
                      <div className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {song.title}
                        </p>
                        {song.author ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {song.author}
                          </p>
                        ) : null}
                      </div>
                      {isCurrent ? (
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-primary">
                          {t('songHeader.songQueueNowPlaying')}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-black/[0.06] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              router.push('/songs')
            }}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 active:bg-primary/80"
          >
            {t('songHeader.backToAllSongs')}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-black/[0.06] bg-muted/50 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted active:bg-muted/80 dark:border-white/[0.08]"
          >
            {t('songHeader.close')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
