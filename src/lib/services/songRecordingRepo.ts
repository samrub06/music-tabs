import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/db'
import type { SongLineMarker, SongRecording } from '@/types'

type SongRecordingRow = Database['public']['Tables']['song_recordings']['Row']

function parseLineMarkers(value: Json | null | undefined): SongLineMarker[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const raw = item as { lineIndex?: unknown; startMs?: unknown }
      if (typeof raw.lineIndex !== 'number' || typeof raw.startMs !== 'number') return null
      return { lineIndex: raw.lineIndex, startMs: raw.startMs }
    })
    .filter((m): m is SongLineMarker => m !== null)
}

function mapDbSongRecordingToDomain(row: SongRecordingRow): SongRecording {
  return {
    id: row.id,
    songId: row.song_id,
    userId: row.user_id,
    storagePath: row.storage_path,
    durationMs: row.duration_ms ?? undefined,
    lineMarkers: parseLineMarkers(row.line_markers),
    isPublic: row.is_public,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export type CreateSongRecordingInput = {
  songId: string
  storagePath: string
  durationMs?: number | null
  lineMarkers?: SongLineMarker[]
  isPublic?: boolean
}

export const songRecordingRepo = (client: SupabaseClient<Database>) => ({
  async create(input: CreateSongRecordingInput): Promise<SongRecording> {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to save a recording')

    const { data, error } = await (client.from('song_recordings') as any)
      .insert({
        song_id: input.songId,
        user_id: user.id,
        storage_path: input.storagePath,
        duration_ms: input.durationMs ?? null,
        line_markers: (input.lineMarkers ?? []) as unknown as Json,
        is_public: input.isPublic ?? false,
      })
      .select(
        'id, song_id, user_id, storage_path, duration_ms, line_markers, is_public, created_at, updated_at'
      )
      .single()

    if (error) throw error
    return mapDbSongRecordingToDomain(data as SongRecordingRow)
  },

  async listBySongId(songId: string): Promise<SongRecording[]> {
    const { data, error } = await (client.from('song_recordings') as any)
      .select(
        'id, song_id, user_id, storage_path, duration_ms, line_markers, is_public, created_at, updated_at'
      )
      .eq('song_id', songId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as SongRecordingRow[]).map(mapDbSongRecordingToDomain)
  },

  async getById(id: string): Promise<SongRecording | null> {
    const { data, error } = await (client.from('song_recordings') as any)
      .select(
        'id, song_id, user_id, storage_path, duration_ms, line_markers, is_public, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapDbSongRecordingToDomain(data as SongRecordingRow) : null
  },

  async updateMarkers(id: string, lineMarkers: SongLineMarker[]): Promise<SongRecording> {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update markers')

    const { data, error } = await (client.from('song_recordings') as any)
      .update({
        line_markers: lineMarkers as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        'id, song_id, user_id, storage_path, duration_ms, line_markers, is_public, created_at, updated_at'
      )
      .single()

    if (error) throw error
    return mapDbSongRecordingToDomain(data as SongRecordingRow)
  },

  async delete(id: string): Promise<void> {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to delete a recording')

    const existing = await this.getById(id)
    if (!existing) return

    const { error: dbError } = await (client.from('song_recordings') as any)
      .delete()
      .eq('id', id)
    if (dbError) throw dbError

    const { error: storageError } = await client.storage
      .from('song-audio')
      .remove([existing.storagePath])
    if (storageError) {
      console.error('Failed to delete recording audio:', storageError)
    }
  },
})
