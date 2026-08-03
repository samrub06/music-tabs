'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { cn } from '@/lib/utils'
import { fetchArtistSongsForNavAction } from '@/app/song/[id]/artistSongsActions'

type NavMode = 'list' | 'artist'

type QueueItem = {
  id: string
  title: string
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
    songs?: Array<{
      id: string
      title?: string
      author?: string
      songImageUrl?: string
      artistImageUrl?: string
    }>
  }
}

function readNav(): SongNavigationData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('songNavigation')
    if (!raw) return null
    const parsed = JSON.parse(raw) as SongNavigationData
    if (!Array.isArray(parsed.songList) || parsed.songList.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

interface SongNavVignetteBarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSongId: string
  currentTitle: string
  currentAuthor: string
  currentSongImageUrl?: string
  currentArtistImageUrl?: string
}

/** Horizontal list/artist browser (triggered from Next chevron). Click → open song. */
export default function SongNavVignetteBar({
  open,
  onOpenChange,
  currentSongId,
  currentTitle,
  currentAuthor,
  currentSongImageUrl,
  currentArtistImageUrl,
}: SongNavVignetteBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [mode, setMode] = useState<NavMode>('list')
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const activeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async () => {
    const nav = readNav()
    if (!nav) {
      setItems([
        {
          id: currentSongId,
          title: currentTitle,
          author: currentAuthor,
          songImageUrl: currentSongImageUrl,
          artistImageUrl: currentArtistImageUrl,
        },
      ])
      return
    }

    const contextSongs = nav.playlistContext?.songs
    if (contextSongs?.some((s) => s.title?.trim())) {
      const byId = new Map(contextSongs.map((s) => [s.id, s]))
      const rows: QueueItem[] = []
      for (const id of nav.songList) {
        const s = byId.get(id)
        if (!s?.title?.trim()) continue
        rows.push({
          id,
          title: s.title,
          author: s.author,
          songImageUrl: s.songImageUrl,
          artistImageUrl: s.artistImageUrl,
        })
      }
      if (rows.length > 0) {
        setItems(rows)
        return
      }
    }

    try {
      const songs = await songRepo(supabase).getSongsByIdsForPublicPlaylist(nav.songList)
      setItems(
        songs.map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author,
          songImageUrl: s.songImageUrl,
          artistImageUrl: s.artistImageUrl,
        }))
      )
    } catch (error) {
      console.error('SongNavVignetteBar list load failed:', error)
      setItems([])
    }
  }, [
    supabase,
    currentSongId,
    currentTitle,
    currentAuthor,
    currentSongImageUrl,
    currentArtistImageUrl,
  ])

  const loadArtist = useCallback(async () => {
    if (!currentAuthor.trim()) {
      setItems([])
      return
    }
    try {
      const others = await fetchArtistSongsForNavAction({
        author: currentAuthor,
        excludeSongId: currentSongId,
        limit: 24,
      })
      setItems([
        {
          id: currentSongId,
          title: currentTitle,
          author: currentAuthor,
          songImageUrl: currentSongImageUrl,
          artistImageUrl: currentArtistImageUrl,
        },
        ...others,
      ])
    } catch (error) {
      console.error('SongNavVignetteBar artist load failed:', error)
      setItems([
        {
          id: currentSongId,
          title: currentTitle,
          author: currentAuthor,
          songImageUrl: currentSongImageUrl,
          artistImageUrl: currentArtistImageUrl,
        },
      ])
    }
  }, [
    currentAuthor,
    currentSongId,
    currentTitle,
    currentSongImageUrl,
    currentArtistImageUrl,
  ])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    const run = mode === 'list' ? loadList : loadArtist
    void run().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, mode, loadList, loadArtist, currentSongId])

  useEffect(() => {
    if (!open) return
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [items, currentSongId, mode, open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const node = panelRef.current
      if (!node) return
      if (event.target instanceof Node && !node.contains(event.target)) {
        const target = event.target as HTMLElement
        if (target.closest('[data-song-browser-trigger]')) return
        onOpenChange(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const navigateToSong = (songId: string) => {
    if (songId === currentSongId) {
      onOpenChange(false)
      return
    }

    if (mode === 'artist') {
      const songList = items.map((i) => i.id)
      const currentIndex = songList.indexOf(songId)
      sessionStorage.setItem(
        'songNavigation',
        JSON.stringify({
          songList,
          currentIndex: currentIndex >= 0 ? currentIndex : 0,
          sourceUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
          playlistContext: {
            isPlaylist: false,
            songs: items.map((i) => ({
              id: i.id,
              title: i.title,
              author: i.author,
              songImageUrl: i.songImageUrl,
              artistImageUrl: i.artistImageUrl,
            })),
          },
        })
      )
      sessionStorage.removeItem('hasUsedNext')
    } else {
      const nav = readNav()
      if (nav) {
        const currentIndex = nav.songList.indexOf(songId)
        sessionStorage.setItem(
          'songNavigation',
          JSON.stringify({
            ...nav,
            currentIndex: currentIndex >= 0 ? currentIndex : nav.currentIndex,
          })
        )
      }
    }

    onOpenChange(false)
    router.replace(`/song/${songId}`)
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute inset-x-0 top-full z-40 border-b border-border/80',
        'bg-background/98 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl',
        'animate-in fade-in-0 slide-in-from-top-1 duration-200'
      )}
      role="dialog"
      aria-label={t('songHeader.navBrowseSongs')}
    >
      <div className="flex items-center justify-center px-3 pt-2.5">
        <div className="flex w-full max-w-md gap-0.5 rounded-full bg-muted/80 p-0.5">
          <button
            type="button"
            onClick={() => setMode('list')}
            className={cn(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm',
              mode === 'list'
                ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('songHeader.navList')}
          </button>
          <button
            type="button"
            onClick={() => setMode('artist')}
            disabled={!currentAuthor.trim()}
            className={cn(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm',
              mode === 'artist'
                ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                : 'text-muted-foreground hover:text-foreground',
              !currentAuthor.trim() && 'opacity-40'
            )}
          >
            {t('songHeader.navArtist')}
          </button>
        </div>
      </div>

      <div
        className="flex gap-2.5 overflow-x-auto overscroll-x-contain px-3 py-3 scrollbar-hide touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading && items.length === 0 ? (
          <p className="w-full py-6 text-center text-xs text-muted-foreground">
            {t('common.loading')}
          </p>
        ) : (
          items.map((item) => {
            const active = item.id === currentSongId
            return (
              <button
                key={item.id}
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => navigateToSong(item.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl p-1 transition-all sm:w-20',
                  active
                    ? 'bg-primary/10 ring-2 ring-primary/40'
                    : 'hover:bg-muted/60'
                )}
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg sm:h-16 sm:w-16">
                  <SongThumbnail
                    songImageUrl={item.songImageUrl}
                    artistImageUrl={item.artistImageUrl}
                    alt={item.title}
                    className="h-full w-full"
                    size="sm"
                  />
                </div>
                <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-foreground sm:text-xs">
                  {item.title}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
