'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SongLineMarker } from '@/types'

export function lineIndexFromMarkers(
  markers: SongLineMarker[],
  currentMs: number
): number {
  if (!markers.length) return 0
  const sorted = [...markers].sort((a, b) => a.startMs - b.startMs)
  let active = sorted[0]!.lineIndex
  for (const marker of sorted) {
    if (marker.startMs <= currentMs) {
      active = marker.lineIndex
    } else {
      break
    }
  }
  return active
}

export type UsePracticeAudioResult = {
  play: () => void
  pause: () => void
  seek: (ms: number) => void
  currentTimeMs: number
  durationMs: number
  isPlaying: boolean
  activeLineIndex: number
  setMarkers: (markers: SongLineMarker[]) => void
  setSrc: (url: string | null) => void
}

export function usePracticeAudio(): UsePracticeAudioResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const markersRef = useRef<SongLineMarker[]>([])
  const rafRef = useRef<number | null>(null)

  const [currentTimeMs, setCurrentTimeMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [markers, setMarkersState] = useState<SongLineMarker[]>([])

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
    }
    return audioRef.current
  }, [])

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const ms = Math.round(audio.currentTime * 1000)
    setCurrentTimeMs(ms)
    setActiveLineIndex(lineIndexFromMarkers(markersRef.current, ms))
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const startRaf = useCallback(() => {
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [stopRaf, tick])

  useEffect(() => {
    const audio = ensureAudio()

    const onPlay = () => {
      setIsPlaying(true)
      startRaf()
    }
    const onPause = () => {
      setIsPlaying(false)
      stopRaf()
      const ms = Math.round(audio.currentTime * 1000)
      setCurrentTimeMs(ms)
      setActiveLineIndex(lineIndexFromMarkers(markersRef.current, ms))
    }
    const onEnded = () => {
      setIsPlaying(false)
      stopRaf()
    }
    const onLoaded = () => {
      setDurationMs(Math.round((audio.duration || 0) * 1000))
    }
    const onTimeUpdate = () => {
      const ms = Math.round(audio.currentTime * 1000)
      setCurrentTimeMs(ms)
      setActiveLineIndex(lineIndexFromMarkers(markersRef.current, ms))
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      stopRaf()
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.src = ''
      audioRef.current = null
    }
  }, [ensureAudio, startRaf, stopRaf])

  const setMarkers = useCallback((next: SongLineMarker[]) => {
    markersRef.current = next
    setMarkersState(next)
    const audio = audioRef.current
    const ms = audio ? Math.round(audio.currentTime * 1000) : 0
    setActiveLineIndex(lineIndexFromMarkers(next, ms))
  }, [])

  const setSrc = useCallback(
    (url: string | null) => {
      const audio = ensureAudio()
      const wasPlaying = !audio.paused
      audio.pause()
      stopRaf()
      setIsPlaying(false)
      setCurrentTimeMs(0)
      setActiveLineIndex(lineIndexFromMarkers(markersRef.current, 0))
      if (!url) {
        audio.removeAttribute('src')
        audio.load()
        setDurationMs(0)
        return
      }
      audio.src = url
      audio.load()
      if (wasPlaying) {
        void audio.play().catch(() => {
          setIsPlaying(false)
        })
      }
    },
    [ensureAudio, stopRaf]
  )

  const play = useCallback(() => {
    const audio = ensureAudio()
    void audio.play().catch(() => {
      setIsPlaying(false)
    })
  }, [ensureAudio])

  const pause = useCallback(() => {
    ensureAudio().pause()
  }, [ensureAudio])

  const seek = useCallback(
    (ms: number) => {
      const audio = ensureAudio()
      const clamped = Math.max(0, ms) / 1000
      audio.currentTime = clamped
      const nextMs = Math.round(clamped * 1000)
      setCurrentTimeMs(nextMs)
      setActiveLineIndex(lineIndexFromMarkers(markersRef.current, nextMs))
    },
    [ensureAudio]
  )

  // Keep markers ref in sync when state changes externally
  useEffect(() => {
    markersRef.current = markers
  }, [markers])

  return {
    play,
    pause,
    seek,
    currentTimeMs,
    durationMs,
    isPlaying,
    activeLineIndex,
    setMarkers,
    setSrc,
  }
}
