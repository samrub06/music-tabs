'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { YoutubeTutorialVideo } from '@/lib/services/youtubeService'
import {
  buildYoutubeSearchPageUrl,
  buildYoutubeSearchQuery,
  type YoutubeVideoMode,
} from '@/utils/youtubeTutorial'
import {
  loadYoutubeIframeApi,
  type YoutubePlayerHandle,
  type YTPlayerInstance,
} from '@/lib/youtube/iframeApi'

interface FloatingYoutubeTutorialProps {
  songId?: string
  songTitle: string
  songAuthor: string
  selectedInstrument: 'piano' | 'guitar'
  isOpen: boolean
  videoMode: YoutubeVideoMode
  onClose: () => void
  playerApiRef?: React.MutableRefObject<YoutubePlayerHandle | null>
  onVideoIdChange?: (videoId: string | null) => void
  onPlayerReadyChange?: (ready: boolean) => void
  syncBanner?: React.ReactNode
}

const MIN_WIDTH = 200
const MIN_HEIGHT = 140
const DEFAULT_WIDTH = 340
const DEFAULT_HEIGHT = 220
const HANDLE = 18
const SEEK_STEP_SEC = 15
const YT_PLAYING = 1

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; video: YoutubeTutorialVideo }
  | { status: 'error'; message: string }

type CachedVideo = {
  video: YoutubeTutorialVideo
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FloatingYoutubeTutorial({
  songId,
  songTitle,
  songAuthor,
  selectedInstrument,
  isOpen,
  videoMode,
  onClose,
  playerApiRef,
  onVideoIdChange,
  onPlayerReadyChange,
}: FloatingYoutubeTutorialProps) {
  const { t, language } = useLanguage()
  const playerHostRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null)
  const cacheRef = useRef<Map<string, CachedVideo>>(new Map())
  const sizeRef = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const positionRef = useRef({ x: 16, y: 72 })
  const scrubbingRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [isAudioMode, setIsAudioMode] = useState(videoMode === 'audio')
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [position, setPosition] = useState({ x: 16, y: 72 })
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
  const resizeStateRef = useRef<{
    pointerId: number
    corner: ResizeCorner
    startX: number
    startY: number
    originW: number
    originH: number
    originX: number
    originY: number
  } | null>(null)

  sizeRef.current = size
  positionRef.current = position

  const searchQuery = useMemo(
    () =>
      buildYoutubeSearchQuery(
        videoMode,
        songTitle,
        songAuthor,
        selectedInstrument,
        language as 'en' | 'fr' | 'he'
      ),
    [videoMode, songTitle, songAuthor, selectedInstrument, language]
  )

  const cacheKey = useMemo(
    () =>
      songId
        ? `${songId}::${videoMode}::${selectedInstrument}::${language}`
        : `${searchQuery}::${language}`,
    [songId, videoMode, selectedInstrument, searchQuery, language]
  )

  const youtubePageUrl = useMemo(() => buildYoutubeSearchPageUrl(searchQuery), [searchQuery])

  useEffect(() => {
    setMounted(true)
  }, [])

  const placeBottomRight = useCallback(() => {
    if (typeof window === 'undefined' || isAudioMode) return
    const margin = 12
    const bottomInset = window.innerWidth < 1024 ? 88 : 24
    setPosition({
      x: Math.max(margin, window.innerWidth - size.width - margin),
      y: Math.max(56, window.innerHeight - size.height - bottomInset),
    })
  }, [isAudioMode, size.height, size.width])

  useEffect(() => {
    if (!isOpen) return
    setIsAudioMode(videoMode === 'audio')
  }, [isOpen, videoMode])

  useEffect(() => {
    if (!isOpen || isAudioMode) return
    placeBottomRight()
  }, [isOpen, isAudioMode, placeBottomRight])

  useEffect(() => {
    if (isOpen) return

    setIsAudioMode(false)
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
    setFetchState({ status: 'idle' })
    setActiveVideoId(null)
    setPlayerReady(false)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    ytPlayerRef.current?.destroy()
    ytPlayerRef.current = null
    if (playerApiRef) playerApiRef.current = null
    onVideoIdChange?.(null)
    onPlayerReadyChange?.(false)
    cacheRef.current.clear()
  }, [isOpen, onPlayerReadyChange, onVideoIdChange, playerApiRef])

  useEffect(() => {
    if (!isOpen) return

    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setActiveVideoId(cached.video.videoId)
      setFetchState({ status: 'success', video: cached.video })
      onVideoIdChange?.(cached.video.videoId)
      return
    }

    const controller = new AbortController()

    async function loadVideo() {
      setFetchState({ status: 'loading' })
      setActiveVideoId(null)
      setPlayerReady(false)
      onVideoIdChange?.(null)
      onPlayerReadyChange?.(false)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          lang: language,
          mode: videoMode,
          instrument: selectedInstrument,
        })
        if (songId) params.set('songId', songId)
        const response = await fetch(`/api/youtube/tutorial?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error ?? 'Failed to load video')
        }

        const payload = (await response.json()) as { video: YoutubeTutorialVideo }
        const nextVideo = payload.video
        cacheRef.current.set(cacheKey, { video: nextVideo })
        setActiveVideoId(nextVideo.videoId)
        setFetchState({ status: 'success', video: nextVideo })
        onVideoIdChange?.(nextVideo.videoId)
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Failed to load video'
        setFetchState({ status: 'error', message })
      }
    }

    void loadVideo()

    return () => controller.abort()
  }, [isOpen, cacheKey, searchQuery, language, songId, videoMode, selectedInstrument, onVideoIdChange, onPlayerReadyChange])

  useEffect(() => {
    if (!isOpen || !activeVideoId || !playerHostRef.current) return

    let destroyed = false

    void (async () => {
      await loadYoutubeIframeApi()
      if (destroyed || !playerHostRef.current || !window.YT?.Player) return

      ytPlayerRef.current?.destroy()
      setPlayerReady(false)
      onPlayerReadyChange?.(false)

      ytPlayerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId: activeVideoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return
            setPlayerReady(true)
            onPlayerReadyChange?.(true)
            try {
              event.target.playVideo()
            } catch {
              ytPlayerRef.current?.playVideo()
            }
            const handle: YoutubePlayerHandle = {
              seekTo: (seconds: number) => {
                ytPlayerRef.current?.seekTo(seconds, true)
                ytPlayerRef.current?.playVideo()
              },
              getCurrentTime: () => ytPlayerRef.current?.getCurrentTime() ?? 0,
              getDuration: () => ytPlayerRef.current?.getDuration() ?? 0,
              play: () => ytPlayerRef.current?.playVideo(),
              pause: () => ytPlayerRef.current?.pauseVideo(),
              isReady: () => true,
              getVideoId: () => activeVideoId,
            }
            if (playerApiRef) playerApiRef.current = handle
          },
        },
      })
    })()

    return () => {
      destroyed = true
      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = null
      if (playerApiRef) playerApiRef.current = null
    }
  }, [isOpen, activeVideoId, onPlayerReadyChange, playerApiRef])

  useEffect(() => {
    if (!isOpen || !isAudioMode || !playerReady) return

    const tick = () => {
      const player = ytPlayerRef.current
      if (!player) return
      try {
        if (!scrubbingRef.current) {
          setCurrentTime(player.getCurrentTime() ?? 0)
        }
        setDuration(player.getDuration() ?? 0)
        setIsPlaying(player.getPlayerState() === (window.YT?.PlayerState?.PLAYING ?? YT_PLAYING))
      } catch {
        // Player may be mid-destroy
      }
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [isOpen, isAudioMode, playerReady])

  const clampPosition = useCallback(
    (next: { x: number; y: number }, panelWidth: number, panelHeight: number) => {
      if (typeof window === 'undefined') return next
      const margin = 8
      return {
        x: clamp(next.x, margin, window.innerWidth - panelWidth - margin),
        y: clamp(next.y, 56, window.innerHeight - panelHeight - margin),
      }
    },
    []
  )

  const stopPanelEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const onDragPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onDragPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true
    setPosition(
      clampPosition(
        {
          x: drag.originX + dx,
          y: drag.originY + dy,
        },
        size.width,
        size.height
      )
    )
  }

  const onDragPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const stopControlPointer = (event: React.PointerEvent) => {
    event.stopPropagation()
  }

  const onResizePointerDown = (corner: ResizeCorner) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAudioMode) return
    event.preventDefault()
    event.stopPropagation()
    resizeStateRef.current = {
      pointerId: event.pointerId,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      originW: sizeRef.current.width,
      originH: sizeRef.current.height,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onResizePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const resize = resizeStateRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    event.preventDefault()

    const maxW = typeof window !== 'undefined' ? Math.min(720, window.innerWidth - 24) : 720
    const maxH = typeof window !== 'undefined' ? Math.min(520, window.innerHeight - 80) : 520
    const dx = event.clientX - resize.startX
    const dy = event.clientY - resize.startY

    let nextW = resize.originW
    let nextH = resize.originH
    let nextX = resize.originX
    let nextY = resize.originY

    if (resize.corner.includes('e')) {
      nextW = clamp(resize.originW + dx, MIN_WIDTH, maxW)
    }
    if (resize.corner.includes('w')) {
      nextW = clamp(resize.originW - dx, MIN_WIDTH, maxW)
      nextX = resize.originX + (resize.originW - nextW)
    }
    if (resize.corner.includes('s')) {
      nextH = clamp(resize.originH + dy, MIN_HEIGHT, maxH)
    }
    if (resize.corner.includes('n')) {
      nextH = clamp(resize.originH - dy, MIN_HEIGHT, maxH)
      nextY = resize.originY + (resize.originH - nextH)
    }

    const clamped = clampPosition({ x: nextX, y: nextY }, nextW, nextH)
    setSize({ width: nextW, height: nextH })
    setPosition(clamped)
  }

  const onResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      resizeStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const seekToSeconds = useCallback((seconds: number, { play = true }: { play?: boolean } = {}) => {
    const player = ytPlayerRef.current
    if (!player) return
    let max = 0
    try {
      max = player.getDuration() ?? 0
    } catch {
      max = 0
    }
    const clamped = clamp(seconds, 0, max > 0 ? max : Math.max(0, seconds))
    try {
      player.seekTo(clamped, true)
      if (play) player.playVideo()
    } catch {
      return
    }
    setCurrentTime(clamped)
    if (play) setIsPlaying(true)
  }, [])

  const seekRelative = useCallback(
    (delta: number) => {
      const player = ytPlayerRef.current
      if (!player) return
      let now = 0
      try {
        now = player.getCurrentTime() ?? 0
      } catch {
        now = currentTime
      }
      seekToSeconds(now + delta, { play: true })
    },
    [currentTime, seekToSeconds]
  )

  const restart = useCallback(() => {
    seekToSeconds(0, { play: true })
  }, [seekToSeconds])

  const togglePlay = useCallback(() => {
    const player = ytPlayerRef.current
    if (!player) return
    const playing = player.getPlayerState() === (window.YT?.PlayerState?.PLAYING ?? YT_PLAYING)
    if (playing) {
      player.pauseVideo()
      setIsPlaying(false)
    } else {
      player.playVideo()
      setIsPlaying(true)
    }
  }, [])

  const onScrubChange = (value: number) => {
    scrubbingRef.current = true
    setCurrentTime(value)
  }

  const onScrubCommit = (value: number) => {
    scrubbingRef.current = false
    seekToSeconds(value, { play: true })
  }

  if (!isOpen || !mounted) return null

  const video = fetchState.status === 'success' ? fetchState.video : null
  const panelTitle = video?.title ?? `${songTitle} · ${songAuthor}`
  const progressMax = duration > 0 ? duration : 1
  const controlsDisabled = !playerReady

  const cornerHandle = (corner: ResizeCorner, cursor: string, className: string) => (
    <div
      role="separator"
      aria-label={t('songHeader.resize')}
      onPointerDown={onResizePointerDown(corner)}
      onPointerMove={onResizePointerMove}
      onPointerUp={onResizePointerUp}
      onPointerCancel={onResizePointerUp}
      className={cn('absolute z-20 touch-none', cursor, className)}
      style={{ width: HANDLE, height: HANDLE }}
    />
  )

  return createPortal(
    <>
      {/* Hidden YouTube host in audio mode (sound only); visible floating frame otherwise */}
      <div
        data-practice-target="youtube-player"
        className={cn(
          'fixed z-[70] overflow-hidden',
          isAudioMode
            ? 'pointer-events-none opacity-0'
            : 'rounded-xl bg-black shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/20 dark:ring-white/10'
        )}
        style={
          isAudioMode
            ? {
                // Keep a tiny on-screen host so the YT API still accepts seek/play.
                // Clip + opacity hide the picture; audio still plays.
                left: 0,
                bottom: 0,
                width: 1,
                height: 1,
                overflow: 'hidden',
                clipPath: 'inset(50%)',
              }
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
              }
        }
        onPointerDown={stopPanelEvent}
        onPointerUp={stopPanelEvent}
        onClick={stopPanelEvent}
        onTouchStart={stopPanelEvent}
        aria-hidden={isAudioMode}
      >
        {!isAudioMode && (
          <div
            className="absolute inset-x-0 top-0 z-10 flex h-8 cursor-grab items-center justify-center touch-none active:cursor-grabbing"
            onPointerDown={onDragPointerDown}
            onPointerMove={onDragPointerMove}
            onPointerUp={onDragPointerUp}
            onPointerCancel={onDragPointerUp}
          >
            <div
              className="pointer-events-none inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-white/90 backdrop-blur-sm"
              aria-hidden
            >
              <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium tracking-wide">
                {t('youtubeTutorial.dragMove')}
              </span>
            </div>
            <span className="sr-only">{t('youtubeTutorial.dragMove')}</span>
          </div>
        )}

        {!isAudioMode && (
          <div
            className="absolute end-2 top-2 z-[80]"
            onPointerDown={stopControlPointer}
            onPointerUp={stopControlPointer}
          >
            <button
              type="button"
              onClick={() => onClose()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-md ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-black/85"
              aria-label={t('songHeader.close')}
            >
              <XMarkIcon className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
        )}

        <div className="relative h-full w-full bg-black">
          {fetchState.status === 'loading' && !activeVideoId && !isAudioMode && (
            <div className="flex h-full items-center justify-center px-4 text-center">
              <p className="text-xs text-white/80">
                {videoMode === 'original' || videoMode === 'audio'
                  ? t('youtubeTutorial.loadingOriginal')
                  : selectedInstrument === 'guitar'
                    ? t('youtubeTutorial.loadingGuitar')
                    : t('youtubeTutorial.loadingPiano')}
              </p>
            </div>
          )}
          {fetchState.status === 'error' && !activeVideoId && !isAudioMode && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-xs text-white/80">
                {videoMode === 'original' || videoMode === 'audio'
                  ? t('youtubeTutorial.loadErrorOriginal')
                  : selectedInstrument === 'guitar'
                    ? t('youtubeTutorial.loadErrorGuitar')
                    : t('youtubeTutorial.loadErrorPiano')}
              </p>
              <a
                href={youtubePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-medium text-red-300 hover:underline"
              >
                {t('youtubeTutorial.openYoutube')}
              </a>
            </div>
          )}
          <div className={cn('h-full w-full', !activeVideoId && 'hidden')}>
            <div ref={playerHostRef} className="h-full w-full" />
          </div>
        </div>

        {!isAudioMode && (
          <>
            {cornerHandle('nw', 'cursor-nwse-resize', 'left-0 top-0')}
            {cornerHandle('ne', 'cursor-nesw-resize', 'right-0 top-0')}
            {cornerHandle('sw', 'cursor-nesw-resize', 'bottom-0 left-0')}
            {cornerHandle('se', 'cursor-nwse-resize', 'bottom-0 right-0')}
          </>
        )}
      </div>

      {isAudioMode && (
        <div
          role="region"
          aria-label={t('youtubeTutorial.audioPlayer')}
          className={cn(
            'fixed inset-x-0 z-[60] border-t border-border bg-background/95 backdrop-blur-xl',
            'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:bottom-0',
            'px-3 pb-2.5 pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]'
          )}
          onPointerDown={stopPanelEvent}
          onClick={stopPanelEvent}
        >
          <div className="mx-auto flex max-w-lg flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{songTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{songAuthor}</p>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t('songHeader.close')}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {fetchState.status === 'loading' && !playerReady && (
              <p className="text-center text-xs text-muted-foreground">
                {t('youtubeTutorial.loadingOriginal')}
              </p>
            )}
            {fetchState.status === 'error' && !playerReady && (
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-xs text-muted-foreground">{t('youtubeTutorial.loadErrorOriginal')}</p>
                <a
                  href={youtubePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('youtubeTutorial.openYoutube')}
                </a>
              </div>
            )}

            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={togglePlay}
                disabled={controlsDisabled}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 disabled:opacity-40"
                aria-label={isPlaying ? t('youtubeTutorial.pause') : t('youtubeTutorial.play')}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="ml-0.5 h-6 w-6" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-end text-[10px] tabular-nums text-muted-foreground">
                {formatClock(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={progressMax}
                step={0.1}
                value={clamp(currentTime, 0, progressMax)}
                disabled={controlsDisabled || duration <= 0}
                aria-label={panelTitle}
                onChange={(e) => onScrubChange(Number(e.target.value))}
                onPointerUp={(e) => onScrubCommit(Number((e.target as HTMLInputElement).value))}
                onPointerCancel={(e) => onScrubCommit(Number((e.target as HTMLInputElement).value))}
                onMouseUp={(e) => onScrubCommit(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => onScrubCommit(Number((e.target as HTMLInputElement).value))}
                onBlur={(e) => onScrubCommit(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-40 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="w-9 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {formatClock(duration)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pb-0.5">
              <button
                type="button"
                onClick={restart}
                disabled={controlsDisabled}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-40"
                aria-label={t('youtubeTutorial.restart')}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => seekRelative(-SEEK_STEP_SEC)}
                disabled={controlsDisabled}
                className="inline-flex h-10 items-center justify-center gap-0.5 rounded-xl border border-border px-2.5 text-foreground disabled:opacity-40"
                aria-label={t('youtubeTutorial.skipBack15')}
              >
                <BackwardIcon className="h-4 w-4" />
                <span className="text-[10px] font-semibold tabular-nums">15</span>
              </button>
              <button
                type="button"
                onClick={() => seekRelative(SEEK_STEP_SEC)}
                disabled={controlsDisabled}
                className="inline-flex h-10 items-center justify-center gap-0.5 rounded-xl border border-border px-2.5 text-foreground disabled:opacity-40"
                aria-label={t('youtubeTutorial.skipForward15')}
              >
                <span className="text-[10px] font-semibold tabular-nums">15</span>
                <ForwardIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
