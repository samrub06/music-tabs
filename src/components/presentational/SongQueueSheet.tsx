'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { BottomSheetDippedTop } from '@/components/ui/BottomSheetDippedTop'
import {
  Sheet,
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
        overlayClassName="backdrop-blur-sm"
        className="!bottom-0 z-[60] flex max-h-[70vh] flex-col gap-0 overflow-visible rounded-t-[1.75rem] border-0 border-t-0 bg-transparent p-0 shadow-none"
      >
        <BottomSheetDippedTop hideBorder showClose={false} />

        <div className="flex max-h-[calc(70vh-2rem)] min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 sm:px-6">
            <SheetHeader className="pb-3">
              <SheetTitle className="text-center text-lg">
                {isPlaylist
                  ? t('songHeader.songQueuePlaylistTitle')
                  : t('songHeader.songQueueSongsTitle')}
              </SheetTitle>
            </SheetHeader>

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
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition-colors',
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

            <div className="shrink-0 space-y-2 border-t border-border/70 bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  router.push('/songs')
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
              >
                {t('songHeader.backToAllSongs')}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:bg-muted/80"
              >
                {t('songHeader.close')}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
