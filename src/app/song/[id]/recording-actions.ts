'use server'

import { revalidatePath } from 'next/cache'
import { createActionServerClient } from '@/lib/supabase/server'
import { songRecordingRepo } from '@/lib/services/songRecordingRepo'
import {
  MAX_SONG_RECORDING_BYTES,
  MAX_SONG_RECORDING_DURATION_MS,
  saveSongRecordingSchema,
  updateSongRecordingMarkersSchema,
} from '@/lib/validation/schemas'
import type { SongRecording } from '@/types'

const AUDIO_MIME_PREFIX = 'audio/'

function parseOptionalInt(value: FormDataEntryValue | null): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'string' ? Number(value) : Number(String(value))
  return Number.isFinite(n) ? Math.round(n) : undefined
}

function parseOptionalJsonArray(value: FormDataEntryValue | null): unknown {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

async function createPlaybackUrl(
  supabase: Awaited<ReturnType<typeof createActionServerClient>>,
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('song-audio')
    .createSignedUrl(storagePath, 60 * 60)
  if (error) {
    console.error('Failed to create signed URL for song recording:', error)
    return null
  }
  return data.signedUrl
}

export async function saveSongRecordingAction(formData: FormData): Promise<{
  recording: SongRecording
  playbackUrl: string | null
}> {
  const file = formData.get('file')
  if (!(file instanceof File)) {
    throw new Error('Audio file is required')
  }

  const mime = file.type || 'audio/webm'
  if (!mime.startsWith(AUDIO_MIME_PREFIX)) {
    throw new Error('Invalid file type. Expected an audio file.')
  }

  if (file.size > MAX_SONG_RECORDING_BYTES) {
    throw new Error('File too large. Maximum size is 10MB.')
  }

  const durationMs = parseOptionalInt(formData.get('durationMs'))
  if (durationMs != null && durationMs > MAX_SONG_RECORDING_DURATION_MS) {
    throw new Error('Recording too long. Maximum duration is 10 minutes.')
  }

  const isPublicRaw = formData.get('isPublic')
  const isPublic = isPublicRaw === 'true' || isPublicRaw === '1'

  const validated = saveSongRecordingSchema.parse({
    songId: formData.get('songId'),
    durationMs: durationMs ?? null,
    lineMarkers: parseOptionalJsonArray(formData.get('lineMarkers')),
    isPublic,
  })

  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const recordingId = crypto.randomUUID()
  const storagePath = `${user.id}/${validated.songId}/${recordingId}.webm`

  const { error: uploadError } = await supabase.storage
    .from('song-audio')
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: mime,
      upsert: false,
    })

  if (uploadError) {
    console.error('Song recording upload failed:', uploadError)
    throw new Error('Failed to upload recording')
  }

  try {
    const recording = await songRecordingRepo(supabase).create({
      songId: validated.songId,
      storagePath,
      durationMs: validated.durationMs,
      lineMarkers: validated.lineMarkers,
      isPublic: validated.isPublic,
    })

    const playbackUrl = await createPlaybackUrl(supabase, storagePath)
    revalidatePath(`/song/${validated.songId}`)
    return { recording, playbackUrl }
  } catch (err) {
    await supabase.storage.from('song-audio').remove([storagePath])
    throw err
  }
}

export async function updateSongRecordingMarkersAction(
  payload: unknown
): Promise<SongRecording> {
  const validated = updateSongRecordingMarkersSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const repo = songRecordingRepo(supabase)
  const existing = await repo.getById(validated.recordingId)
  if (!existing) throw new Error('Recording not found')
  if (existing.userId !== user.id) throw new Error('Forbidden')

  const updated = await repo.updateMarkers(validated.recordingId, validated.lineMarkers)
  revalidatePath(`/song/${updated.songId}`)
  return updated
}

export async function listSongRecordingsAction(songId: string): Promise<
  Array<SongRecording & { playbackUrl: string | null }>
> {
  const parsed = saveSongRecordingSchema.shape.songId.parse(songId)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const recordings = await songRecordingRepo(supabase).listBySongId(parsed)
  return Promise.all(
    recordings.map(async (recording) => ({
      ...recording,
      playbackUrl: await createPlaybackUrl(supabase, recording.storagePath),
    }))
  )
}

export async function deleteSongRecordingAction(recordingId: string): Promise<void> {
  const id = updateSongRecordingMarkersSchema.shape.recordingId.parse(recordingId)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const repo = songRecordingRepo(supabase)
  const existing = await repo.getById(id)
  if (!existing) return
  if (existing.userId !== user.id) throw new Error('Forbidden')

  await repo.delete(id)
  revalidatePath(`/song/${existing.songId}`)
}
