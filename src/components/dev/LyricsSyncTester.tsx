'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadYoutubeIframeApi,
  type YTPlayerInstance,
} from '@/lib/youtube/iframeApi'

type TimedLine = {
  text: string
  startSec: number | null
  endSec: number | null
  score?: number
}

type TimedSong = {
  videoId: string
  title: string
  model?: string
  lines: TimedLine[]
}

function formatTime(sec: number | null): string {
  if (sec == null || Number.isNaN(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

export function LyricsSyncTester() {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const [song, setSong] = useState<TimedSong | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [lastClicked, setLastClicked] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/dev/beau-papa-timed.json')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load timed lyrics (${res.status})`)
        return res.json() as Promise<TimedSong>
      })
      .then((data) => {
        if (!cancelled) setSong(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Load failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!song?.videoId || !hostRef.current) return

    let destroyed = false

    void (async () => {
      await loadYoutubeIframeApi()
      if (destroyed || !hostRef.current || !window.YT?.Player) return

      playerRef.current?.destroy()
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: song.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!destroyed) setPlayerReady(true)
          },
        },
      })
    })()

    return () => {
      destroyed = true
      playerRef.current?.destroy()
      playerRef.current = null
      setPlayerReady(false)
    }
  }, [song?.videoId])

  useEffect(() => {
    if (!playerReady || !song) return

    const id = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const t = player.getCurrentTime()
      setCurrentTime(t)

      const idx = song.lines.findIndex((line, i) => {
        if (line.startSec == null) return false
        const next = song.lines.slice(i + 1).find((l) => l.startSec != null)
        const end = line.endSec ?? next?.startSec ?? line.startSec + 8
        return t >= line.startSec && t < end
      })
      setActiveIndex(idx >= 0 ? idx : null)
    }, 200)

    return () => window.clearInterval(id)
  }, [playerReady, song])

  const seekToLine = useCallback(
    (index: number) => {
      const line = song?.lines[index]
      const player = playerRef.current
      if (!line || line.startSec == null || !player) return
      setLastClicked(index)
      player.seekTo(line.startSec, true)
      player.playVideo()
    },
    [song]
  )

  const timedCount = useMemo(
    () => song?.lines.filter((l) => l.startSec != null).length ?? 0,
    [song]
  )

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-red-600">
        <p className="font-medium">Could not load timed lyrics</p>
        <p className="mt-1 text-sm">{loadError}</p>
      </div>
    )
  }

  if (!song) {
    return <div className="mx-auto max-w-3xl p-6 text-muted-foreground">Loading…</div>
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dev experiment · lyrics click → YouTube seek
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
        <p className="text-sm text-muted-foreground">
          {timedCount}/{song.lines.length} lines timed
          {song.model ? ` · ${song.model}` : ''} · video{' '}
          <code className="text-xs">{song.videoId}</code>
        </p>
        <p className="text-sm text-muted-foreground">
          Player: {playerReady ? 'ready' : 'loading…'} · now {formatTime(currentTime)}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-black shadow-lg dark:border-white/10">
        <div className="aspect-video w-full">
          <div ref={hostRef} className="h-full w-full" />
        </div>
      </div>

      <ul className="space-y-2">
        {song.lines.map((line, index) => {
          const hasTime = line.startSec != null
          const isActive = activeIndex === index
          const isClicked = lastClicked === index
          return (
            <li key={`${index}-${line.text}`}>
              <button
                type="button"
                disabled={!hasTime || !playerReady}
                onClick={() => seekToLine(index)}
                className={[
                  'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
                  hasTime && playerReady
                    ? 'cursor-pointer hover:border-amber-400/60 hover:bg-amber-500/10'
                    : 'cursor-not-allowed opacity-50',
                  isActive
                    ? 'border-amber-500/70 bg-amber-500/15'
                    : 'border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.06]',
                  isClicked && !isActive ? 'ring-1 ring-amber-400/40' : '',
                ].join(' ')}
              >
                <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-muted-foreground">
                  {formatTime(line.startSec)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-snug text-foreground">{line.text}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {hasTime
                      ? `→ ${formatTime(line.endSec)} · score ${line.score ?? '—'}`
                      : 'missing timing'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
