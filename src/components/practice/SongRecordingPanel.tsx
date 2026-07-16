'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import {
  deleteSongRecordingAction,
  listSongRecordingsAction,
  saveSongRecordingAction,
  updateSongRecordingMarkersAction,
} from '@/app/song/[id]/recording-actions'
import type { SongLineMarker, SongRecording } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SONG_RECORDING_ENABLED } from '@/lib/featureFlags'

type RecordingWithUrl = SongRecording & { playbackUrl: string | null }

export type SongRecordingPanelProps = {
  songId: string
  lineCount: number
  onRecordingReady?: (recording: SongRecording | null, playbackUrl: string | null) => void
  /** Hide the built-in promo card when SongContent owns the hero banner. */
  hidePromoBanner?: boolean
  /** When hero is collapsed/dismissed, show a compact start control. */
  showFallbackStart?: boolean
  /** Expose start/stop so the hero banner CTA can trigger recording. */
  onControlsReady?: (controls: {
    startRecording: () => void
    stopRecording: () => void
    isRecording: boolean
  }) => void
}

export function SongRecordingPanel({
  songId,
  lineCount,
  onRecordingReady,
  hidePromoBanner = false,
  showFallbackStart = false,
  onControlsReady,
}: SongRecordingPanelProps) {
  const { t } = useLanguage()
  const [pending, startTransition] = useTransition()
  const [recordings, setRecordings] = useState<RecordingWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markers, setMarkers] = useState<SongLineMarker[]>([])
  const [markLineIndex, setMarkLineIndex] = useState(0)
  const [isEditorPlaying, setIsEditorPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const editorAudioRef = useRef<HTMLAudioElement | null>(null)

  const selectedRecording = recordings.find((r) => r.id === selectedId) ?? null
  const editorSrc = previewUrl ?? selectedRecording?.playbackUrl ?? null

  const loadRecordings = useCallback(() => {
    startTransition(async () => {
      try {
        const list = await listSongRecordingsAction(songId)
        setRecordings(list)
        setError(null)
      } catch (err) {
        console.error(err)
        setError(t('songContent.recordingLoadError'))
      }
    })
  }, [songId, t])

  useEffect(() => {
    loadRecordings()
  }, [loadRecordings])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    const audio = editorAudioRef.current
    if (!audio || !editorSrc) return
    if (audio.src !== editorSrc) {
      audio.src = editorSrc
      audio.load()
      setIsEditorPlaying(false)
    }
  }, [editorSrc])

  const stopMic = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stopMic()
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(blob)
        setPreviewBlob(blob)
        setPreviewUrl(url)
        setIsRecording(false)
        setRecordingStartedAt(null)
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingStartedAt(Date.now())
      setSelectedId(null)
      setMarkers([])
      setMarkLineIndex(0)
      setPreviewBlob(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } catch (err) {
      console.error(err)
      stopMic()
      setIsRecording(false)
      setError(t('songContent.recordingMicError'))
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      setIsRecording(false)
      stopMic()
    }
  }

  useEffect(() => {
    onControlsReady?.({
      startRecording: () => {
        void startRecording()
      },
      stopRecording,
      isRecording,
    })
    // Intentionally omit startRecording/stopRecording — parent only needs isRecording flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, onControlsReady])

  const discardPreview = () => {
    editorAudioRef.current?.pause()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewBlob(null)
    setRecordingStartedAt(null)
    setIsEditorPlaying(false)
  }

  const uploadPreview = () => {
    if (!previewBlob) return
    const durationMs =
      recordingStartedAt != null ? Math.max(1, Date.now() - recordingStartedAt) : undefined

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', previewBlob, 'practice.webm')
        formData.append('songId', songId)
        if (durationMs != null) formData.append('durationMs', String(durationMs))
        formData.append('lineMarkers', JSON.stringify(markers))

        const { recording, playbackUrl } = await saveSongRecordingAction(formData)
        discardPreview()
        setMarkers(recording.lineMarkers)
        setMarkLineIndex(
          recording.lineMarkers.length > 0
            ? Math.min(
                Math.max(...recording.lineMarkers.map((m) => m.lineIndex)) + 1,
                Math.max(lineCount - 1, 0)
              )
            : 0
        )
        setSelectedId(recording.id)
        loadRecordings()
        onRecordingReady?.(recording, playbackUrl)
        setError(null)
      } catch (err) {
        console.error(err)
        setError(
          err instanceof Error ? err.message : t('songContent.recordingUploadError')
        )
      }
    })
  }

  const selectRecording = (item: RecordingWithUrl) => {
    discardPreview()
    setSelectedId(item.id)
    setMarkers(item.lineMarkers)
    setMarkLineIndex(
      item.lineMarkers.length > 0
        ? Math.min(
            Math.max(...item.lineMarkers.map((m) => m.lineIndex)) + 1,
            Math.max(lineCount - 1, 0)
          )
        : 0
    )
    onRecordingReady?.(item, item.playbackUrl)
  }

  const toggleEditorPlay = () => {
    const audio = editorAudioRef.current
    if (!audio || !editorSrc) return
    if (audio.paused) {
      void audio.play()
      setIsEditorPlaying(true)
    } else {
      audio.pause()
      setIsEditorPlaying(false)
    }
  }

  const markCurrentLine = () => {
    const audio = editorAudioRef.current
    if (!audio || !editorSrc) return
    const startMs = Math.round(audio.currentTime * 1000)
    const lineIndex = Math.min(markLineIndex, Math.max(lineCount - 1, 0))
    setMarkers((prev) => {
      const without = prev.filter((m) => m.lineIndex !== lineIndex)
      return [...without, { lineIndex, startMs }].sort((a, b) => a.startMs - b.startMs)
    })
    setMarkLineIndex((i) => Math.min(i + 1, Math.max(lineCount - 1, 0)))
  }

  const saveMarkers = () => {
    if (!selectedId) return
    startTransition(async () => {
      try {
        const updated = await updateSongRecordingMarkersAction({
          recordingId: selectedId,
          lineMarkers: markers,
        })
        setRecordings((prev) =>
          prev.map((r) =>
            r.id === updated.id ? { ...r, ...updated, playbackUrl: r.playbackUrl } : r
          )
        )
        const current = recordings.find((r) => r.id === selectedId)
        onRecordingReady?.(updated, current?.playbackUrl ?? null)
        setError(null)
      } catch (err) {
        console.error(err)
        setError(t('songContent.recordingMarkersError'))
      }
    })
  }

  const removeRecording = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSongRecordingAction(id)
        setRecordings((prev) => prev.filter((r) => r.id !== id))
        if (selectedId === id) {
          setSelectedId(null)
          setMarkers([])
          onRecordingReady?.(null, null)
        }
      } catch (err) {
        console.error(err)
        setError(t('songContent.recordingDeleteError'))
      }
    })
  }

  if (!SONG_RECORDING_ENABLED) {
    return null
  }

  return (
    <div className="space-y-3">
      {!hidePromoBanner ? (
        <div className="rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {t('songContent.recordingBannerTitle')}
                </h2>
                {isRecording ? (
                  <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    {t('songContent.recordingBannerRecording')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('songContent.recordingBannerDescription')}
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={() => void startRecording()}
                  disabled={pending}
                  className="h-10 min-h-[44px] w-full gap-1.5 rounded-xl bg-red-600 text-white hover:bg-red-500 sm:w-auto"
                >
                  <MicrophoneIcon className="h-4 w-4" aria-hidden />
                  {t('songContent.recordingBannerCta')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-10 min-h-[44px] w-full gap-1.5 rounded-xl sm:w-auto"
                >
                  <StopIcon className="h-4 w-4" aria-hidden />
                  {t('songContent.recordingStop')}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : isRecording ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {t('songContent.recordingBannerRecording')}
          </span>
          <Button
            type="button"
            variant="destructive"
            onClick={stopRecording}
            className="h-9 min-h-[40px] gap-1.5 rounded-xl"
          >
            <StopIcon className="h-4 w-4" aria-hidden />
            {t('songContent.recordingStop')}
          </Button>
        </div>
      ) : showFallbackStart ? (
        <Button
          type="button"
          onClick={() => void startRecording()}
          disabled={pending}
          className="h-10 min-h-[44px] w-full gap-1.5 rounded-xl bg-red-600 text-white hover:bg-red-500"
        >
          <MicrophoneIcon className="h-4 w-4" aria-hidden />
          {t('songContent.recordingBannerCta')}
        </Button>
      ) : null}

      {(editorSrc || recordings.length > 0 || error) ? (
      <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3">

      {editorSrc ? (
        <div className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-2.5">
          <audio
            ref={editorAudioRef}
            onEnded={() => setIsEditorPlaying(false)}
            onPause={() => setIsEditorPlaying(false)}
            onPlay={() => setIsEditorPlaying(true)}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleEditorPlay}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80"
              aria-label={
                isEditorPlaying
                  ? t('songContent.practicePause')
                  : t('songContent.practicePlay')
              }
            >
              {isEditorPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={markCurrentLine}
            >
              {t('songContent.recordingMarkLine').replace(
                '{n}',
                String(markLineIndex + 1)
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('songContent.recordingMarkersCount').replace(
                '{count}',
                String(markers.length)
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {previewBlob ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={uploadPreview}
                  disabled={pending}
                >
                  {t('songContent.recordingUpload')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-xl"
                  onClick={discardPreview}
                  disabled={pending}
                >
                  {t('songContent.recordingDiscard')}
                </Button>
              </>
            ) : selectedId ? (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl"
                onClick={saveMarkers}
                disabled={pending}
              >
                {t('songContent.recordingSaveMarkers')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {recordings.length > 0 ? (
        <ul className="space-y-1.5">
          {recordings.map((item, index) => {
            const isSelected = item.id === selectedId
            const label = t('songContent.recordingItem').replace(
              '{n}',
              String(recordings.length - index)
            )
            return (
              <li key={item.id}>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm transition-colors',
                    isSelected
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border/60 bg-background/60'
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-start"
                    onClick={() => selectRecording(item)}
                  >
                    <span className="block truncate font-medium text-foreground">
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.lineMarkers.length > 0
                        ? t('songContent.recordingHasMarkers').replace(
                            '{count}',
                            String(item.lineMarkers.length)
                          )
                        : t('songContent.recordingNoMarkers')}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => removeRecording(item.id)}
                    aria-label={t('songContent.recordingDelete')}
                    disabled={pending}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      ) : null}
    </div>
  )
}
