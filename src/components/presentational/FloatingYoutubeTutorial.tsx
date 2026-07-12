'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Youtube } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { YoutubeTutorialVideo } from '@/lib/services/youtubeService'
import {
  buildYoutubeSearchPageUrl,
  buildYoutubeSearchQuery,
  buildYoutubeVideoEmbedUrl,
  type YoutubeVideoMode,
} from '@/utils/youtubeTutorial'

interface FloatingYoutubeTutorialProps {
  songTitle: string
  songAuthor: string
  selectedInstrument: 'piano' | 'guitar'
  isOpen: boolean
  videoMode: YoutubeVideoMode
  onClose: () => void
}

const MIN_WIDTH = 260
const MIN_HEIGHT = 180
const DEFAULT_WIDTH = 340
const DEFAULT_HEIGHT = 260
const LARGE_WIDTH = 420
const LARGE_HEIGHT = 320

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; video: YoutubeTutorialVideo }
  | { status: 'error'; message: string }

type CachedVideo = {
  video: YoutubeTutorialVideo
  embedSrc: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function FloatingYoutubeTutorial({
  songTitle,
  songAuthor,
  selectedInstrument,
  isOpen,
  videoMode,
  onClose,
}: FloatingYoutubeTutorialProps) {
  const { t, language } = useLanguage()
  const panelRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const cacheRef = useRef<Map<string, CachedVideo>>(new Map())
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLarge, setIsLarge] = useState(false)
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [position, setPosition] = useState({ x: 16, y: 72 })
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [activeEmbedSrc, setActiveEmbedSrc] = useState<string | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const resizeStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originW: number
    originH: number
  } | null>(null)

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
    () => `${videoMode}::${searchQuery}::${language}`,
    [videoMode, searchQuery, language]
  )

  const youtubePageUrl = useMemo(() => buildYoutubeSearchPageUrl(searchQuery), [searchQuery])

  useEffect(() => {
    setMounted(true)
  }, [])

  const placeBottomRight = useCallback(() => {
    if (typeof window === 'undefined') return
    const margin = 12
    const bottomInset = window.innerWidth < 1024 ? 88 : 24
    const width = isLarge ? LARGE_WIDTH : size.width
    const height = isLarge ? LARGE_HEIGHT : size.height
    setPosition({
      x: Math.max(margin, window.innerWidth - width - margin),
      y: Math.max(56, window.innerHeight - height - bottomInset),
    })
  }, [isLarge, size.height, size.width])

  useEffect(() => {
    if (!isOpen) return
    placeBottomRight()
  }, [isOpen, placeBottomRight])

  useEffect(() => {
    if (isOpen) return

    setIsMinimized(false)
    setIsLarge(false)
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
    setFetchState({ status: 'idle' })
    setActiveEmbedSrc(null)
    cacheRef.current.clear()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setActiveEmbedSrc(cached.embedSrc)
      setFetchState({ status: 'success', video: cached.video })
      return
    }

    const controller = new AbortController()

    async function loadVideo() {
      setFetchState({ status: 'loading' })
      setActiveEmbedSrc(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          lang: language,
        })
        const response = await fetch(`/api/youtube/tutorial?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error ?? 'Failed to load video')
        }

        const payload = (await response.json()) as { video: YoutubeTutorialVideo }
        const nextVideo = payload.video
        const nextEmbedSrc = buildYoutubeVideoEmbedUrl(nextVideo.videoId)
        cacheRef.current.set(cacheKey, { video: nextVideo, embedSrc: nextEmbedSrc })
        setActiveEmbedSrc(nextEmbedSrc)
        setFetchState({ status: 'success', video: nextVideo })
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Failed to load video'
        setFetchState({ status: 'error', message })
      }
    }

    void loadVideo()

    return () => controller.abort()
  }, [isOpen, cacheKey, searchQuery, language])

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

  const onDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    const width = isLarge ? LARGE_WIDTH : size.width
    const height = isMinimized ? 44 : isLarge ? LARGE_HEIGHT : size.height
    const next = clampPosition(
      {
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      },
      width,
      height
    )
    setPosition(next)
  }

  const onDragPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const stopControlPointer = (event: React.PointerEvent) => {
    event.stopPropagation()
  }

  const onResizePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMinimized || isLarge) return
    event.preventDefault()
    event.stopPropagation()
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originW: size.width,
      originH: size.height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onResizePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const resize = resizeStateRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    const maxW = typeof window !== 'undefined' ? Math.min(560, window.innerWidth - 24) : 560
    const maxH = typeof window !== 'undefined' ? Math.min(480, window.innerHeight - 120) : 480
    const nextW = clamp(resize.originW + (event.clientX - resize.startX), MIN_WIDTH, maxW)
    const nextH = clamp(resize.originH + (event.clientY - resize.startY), MIN_HEIGHT, maxH)
    setSize({ width: nextW, height: nextH })
    setPosition((prev) => clampPosition(prev, nextW, nextH))
  }

  const onResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      resizeStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  if (!isOpen || !mounted) return null

  const panelWidth = isLarge ? LARGE_WIDTH : size.width
  const panelHeight = isMinimized ? 44 : isLarge ? LARGE_HEIGHT : size.height
  const video = fetchState.status === 'success' ? fetchState.video : null
  const embedSrc = activeEmbedSrc
  const panelTitle = video?.title ?? searchQuery

  const panel = (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-background/95 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/[0.1] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        isMinimized && 'rounded-full'
      )}
      style={{
        left: position.x,
        top: position.y,
        width: panelWidth,
        height: panelHeight,
      }}
      onPointerDown={stopPanelEvent}
      onPointerUp={stopPanelEvent}
      onClick={stopPanelEvent}
      onTouchStart={stopPanelEvent}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border/70 bg-muted/40 px-2.5 py-2',
          isMinimized && 'border-b-0 rounded-full px-3'
        )}
      >
        <div
          className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 active:cursor-grabbing"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
        >
          <Youtube className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{panelTitle}</p>
          </div>
        </div>
        <div
          className="relative z-10 flex shrink-0 items-center gap-0.5 touch-manipulation"
          onPointerDown={stopControlPointer}
          onPointerUp={stopControlPointer}
        >
          {!isMinimized && (
            <button
              type="button"
              onClick={() => setIsLarge((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
              aria-label={isLarge ? t('youtubeTutorial.shrink') : t('youtubeTutorial.expand')}
            >
              {isLarge ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
          >
            {isMinimized ? t('youtubeTutorial.open') : t('youtubeTutorial.minimize')}
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
            aria-label={t('songHeader.close')}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="relative min-h-0 flex-1 bg-black touch-manipulation">
            {fetchState.status === 'loading' && !embedSrc && (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <p className="text-xs text-white/80">
                  {videoMode === 'original'
                    ? t('youtubeTutorial.loadingOriginal')
                    : t('youtubeTutorial.loading')}
                </p>
              </div>
            )}
            {fetchState.status === 'error' && !embedSrc && (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                <p className="text-xs text-white/80">
                  {videoMode === 'original'
                    ? t('youtubeTutorial.loadErrorOriginal')
                    : t('youtubeTutorial.loadError')}
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
            {embedSrc && (
              <iframe
                ref={iframeRef}
                key={embedSrc}
                title={panelTitle}
                src={embedSrc}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
          {!isLarge && (
            <div
              role="separator"
              aria-label={t('songHeader.resize')}
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              onPointerCancel={onResizePointerUp}
              className="absolute bottom-0 right-0 h-8 w-8 cursor-nwse-resize touch-none"
            >
              <span className="absolute bottom-1 right-1 block h-2.5 w-2.5 rounded-br border-b-2 border-r-2 border-muted-foreground/50" />
            </div>
          )}
        </>
      )}
    </div>
  )

  return createPortal(panel, document.body)
}
