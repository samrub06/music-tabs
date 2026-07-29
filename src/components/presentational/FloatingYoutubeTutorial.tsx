'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Youtube } from 'lucide-react'
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
const BUBBLE_SIZE = 56
const HANDLE = 18

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
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(videoMode === 'audio')
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [position, setPosition] = useState({ x: 16, y: 72 })
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
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
    if (typeof window === 'undefined') return
    const margin = 12
    const bottomInset = window.innerWidth < 1024 ? 88 : 24
    const width = isMinimized ? BUBBLE_SIZE : size.width
    const height = isMinimized ? BUBBLE_SIZE : size.height
    setPosition({
      x: Math.max(margin, window.innerWidth - width - margin),
      y: Math.max(56, window.innerHeight - height - bottomInset),
    })
  }, [isMinimized, size.height, size.width])

  useEffect(() => {
    if (!isOpen) return
    setIsMinimized(videoMode === 'audio')
  }, [isOpen, videoMode])

  useEffect(() => {
    if (!isOpen) return
    placeBottomRight()
  }, [isOpen, placeBottomRight])

  useEffect(() => {
    if (isOpen) return

    setIsMinimized(false)
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
    setFetchState({ status: 'idle' })
    setActiveVideoId(null)
    setPlayerReady(false)
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
            // User opened via a click; start playback without an extra play tap.
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
              play: () => ytPlayerRef.current?.playVideo(),
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
    const width = isMinimized ? BUBBLE_SIZE : size.width
    const height = isMinimized ? BUBBLE_SIZE : size.height
    setPosition(
      clampPosition(
        {
          x: drag.originX + dx,
          y: drag.originY + dy,
        },
        width,
        height
      )
    )
  }

  const onDragPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      const moved = dragStateRef.current.moved
      dragStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
      return moved
    }
    return false
  }

  const stopControlPointer = (event: React.PointerEvent) => {
    event.stopPropagation()
  }

  const onResizePointerDown = (corner: ResizeCorner) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMinimized) return
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

  const expandAndPlay = useCallback(() => {
    setIsMinimized(false)
    requestAnimationFrame(() => {
      ytPlayerRef.current?.playVideo()
    })
  }, [])

  if (!isOpen || !mounted) return null

  const panelWidth = isMinimized ? BUBBLE_SIZE : size.width
  const panelHeight = isMinimized ? BUBBLE_SIZE : size.height
  const video = fetchState.status === 'success' ? fetchState.video : null
  const panelTitle = video?.title ?? searchQuery

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
      <div
        data-practice-target="youtube-player"
        className={cn(
          'fixed z-[70] overflow-hidden',
          isMinimized
            ? 'pointer-events-none opacity-0'
            : 'rounded-xl bg-black shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/20 dark:ring-white/10'
        )}
        style={
          isMinimized
            ? {
                left: -10000,
                top: 0,
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT,
              }
            : {
                left: position.x,
                top: position.y,
                width: panelWidth,
                height: panelHeight,
              }
        }
        onPointerDown={stopPanelEvent}
        onPointerUp={stopPanelEvent}
        onClick={stopPanelEvent}
        onTouchStart={stopPanelEvent}
        aria-hidden={isMinimized}
      >
        {/* Drag strip — top edge only, keeps chrome minimal */}
        {!isMinimized && (
          <div
            className="absolute inset-x-0 top-0 z-10 h-7 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onDragPointerDown}
            onPointerMove={onDragPointerMove}
            onPointerUp={onDragPointerUp}
            onPointerCancel={onDragPointerUp}
          />
        )}

        {/* Close only */}
        {!isMinimized && (
          <div
            className="absolute end-1.5 top-1.5 z-30"
            onPointerDown={stopControlPointer}
            onPointerUp={stopControlPointer}
          >
            <button
              type="button"
              onClick={() => onClose()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white"
              aria-label={t('songHeader.close')}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="relative h-full w-full bg-black">
          {fetchState.status === 'loading' && !activeVideoId && !isMinimized && (
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
          {fetchState.status === 'error' && !activeVideoId && !isMinimized && (
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

        {!isMinimized && (
          <>
            {cornerHandle('nw', 'cursor-nwse-resize', 'left-0 top-0')}
            {cornerHandle('ne', 'cursor-nesw-resize', 'right-0 top-0')}
            {cornerHandle('sw', 'cursor-nesw-resize', 'bottom-0 left-0')}
            {cornerHandle('se', 'cursor-nwse-resize', 'bottom-0 right-0')}
          </>
        )}
      </div>

      {isMinimized && (
        <div
          className="fixed z-[70]"
          style={{ left: position.x, top: position.y, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
          onPointerDown={stopPanelEvent}
          onClick={stopPanelEvent}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              className="group relative flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-[#ff0000] text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-transform active:scale-95 active:cursor-grabbing"
              aria-label={t('youtubeTutorial.open')}
              title={panelTitle}
              onPointerDown={onDragPointerDown}
              onPointerMove={onDragPointerMove}
              onPointerUp={(e) => {
                const moved = onDragPointerUp(e)
                if (!moved) expandAndPlay()
              }}
              onPointerCancel={onDragPointerUp}
            >
              <Youtube className="h-7 w-7" strokeWidth={2.25} />
              {playerReady && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onClose()}
              onPointerDown={stopControlPointer}
              className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/95 text-muted-foreground shadow-sm ring-1 ring-black/10 hover:text-foreground dark:ring-white/15"
              aria-label={t('songHeader.close')}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
