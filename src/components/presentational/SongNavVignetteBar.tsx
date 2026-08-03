'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { cn } from '@/lib/utils'
import {
  fetchArtistSongsForNavAction,
  type ArtistSongNavItem,
} from '@/app/song/[id]/artistSongsActions'

type NavMode = 'queue' | 'artist'

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
  currentSongId: string
  currentTitle: string
  currentAuthor: string
  currentSongImageUrl?: string
  currentArtistImageUrl?: string
}

export default function SongNavVignetteBar({
  currentSongId,
  currentTitle,
  currentAuthor,
  currentSongImageUrl,
  currentArtistImageUrl,
}: SongNavVignetteBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [mode, setMode] = useState<NavMode>('queue')
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  const loadQueue = useCallback(async () => {
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
      console.error('SongNavVignetteBar queue load failed:', error)
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
      const current: ArtistSongNavItem = {
        id: currentSongId,
        title: currentTitle,
        author: currentAuthor,
        songImageUrl: currentSongImageUrl,
        artistImageUrl: currentArtistImageUrl,
      }
      setItems([current, ...others])
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
    let cancelled = false
    setLoading(true)
    const run = mode === 'queue' ? loadQueue : loadArtist
    void run().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [mode, loadQueue, loadArtist, currentSongId])

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [items, currentSongId, mode])

  const handleSelect = (songId: string) => {
    if (songId === currentSongId) return

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

    router.replace(`/song/${songId}`)
  }

  if (!currentAuthor && mode === 'artist') return null

  return (
    <div className="shrink-0 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-center px-3 pt-2">
        <div className="flex w-full max-w-md rounded-full bg-muted/80 p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setMode('queue')}
            className={cn(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm',
              mode === 'queue'
                ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('songHeader.navQueue')}
          </button>
          <button
            type="button"
            onClick={() => setMode('artist')}
            className={cn(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm',
              mode === 'artist'
                ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('songHeader.navArtist')}
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading && items.length === 0 ? (
          <p className="w-full py-4 text-center text-xs text-muted-foreground">
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
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl p-1 transition-all sm:w-20',
                  active
                    ? 'bg-primary/10 ring-2 ring-primary/40'
                    : 'hover:bg-muted/60'
                )}
                aria-current={active ? 'true' : undefined}
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
