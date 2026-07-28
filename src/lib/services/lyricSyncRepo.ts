import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/db'
import type { LyricSyncLine, LyricSyncStatus, SongLyricSync } from '@/types'

type LyricSyncRow = Database['public']['Tables']['song_lyric_syncs']['Row']

function mapDbToDomain(row: LyricSyncRow): SongLyricSync {
  const status = (row.status as LyricSyncStatus) || 'pending'
  const lines = Array.isArray(row.lines) ? (row.lines as unknown as LyricSyncLine[]) : []
  return {
    id: row.id,
    songId: row.song_id,
    youtubeVideoId: row.youtube_video_id,
    status,
    lines,
    model: row.model ?? undefined,
    error: row.error ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export const lyricSyncRepo = (client: SupabaseClient<Database>) => {
  // New table may not be in generated client until CLI regen
  const syncTable = () => (client as SupabaseClient<any>).from('song_lyric_syncs')

  return {
    async getBySongAndVideo(
      songId: string,
      youtubeVideoId: string
    ): Promise<SongLyricSync | null> {
      const { data, error } = await syncTable()
        .select('*')
        .eq('song_id', songId)
        .eq('youtube_video_id', youtubeVideoId)
        .maybeSingle()

      if (error) throw error
      return data ? mapDbToDomain(data as LyricSyncRow) : null
    },

    async getReadyBySongId(songId: string): Promise<SongLyricSync | null> {
      const { data, error } = await syncTable()
        .select('*')
        .eq('song_id', songId)
        .eq('status', 'ready')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ? mapDbToDomain(data as LyricSyncRow) : null
    },

    async upsertPending(songId: string, youtubeVideoId: string): Promise<SongLyricSync> {
      const { data, error } = await syncTable()
        .upsert(
          {
            song_id: songId,
            youtube_video_id: youtubeVideoId,
            status: 'pending',
            lines: [] as unknown as Json,
            error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'song_id,youtube_video_id' }
        )
        .select('*')
        .single()

      if (error) throw error
      return mapDbToDomain(data as LyricSyncRow)
    },

    async markReady(input: {
      songId: string
      youtubeVideoId: string
      lines: LyricSyncLine[]
      model?: string
    }): Promise<SongLyricSync> {
      const { data, error } = await syncTable()
        .upsert(
          {
            song_id: input.songId,
            youtube_video_id: input.youtubeVideoId,
            status: 'ready',
            lines: input.lines as unknown as Json,
            model: input.model ?? 'whisper-base',
            error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'song_id,youtube_video_id' }
        )
        .select('*')
        .single()

      if (error) throw error
      return mapDbToDomain(data as LyricSyncRow)
    },

    async markFailed(
      songId: string,
      youtubeVideoId: string,
      errorMessage: string
    ): Promise<SongLyricSync> {
      const { data, error } = await syncTable()
        .upsert(
          {
            song_id: songId,
            youtube_video_id: youtubeVideoId,
            status: 'failed',
            lines: [] as unknown as Json,
            error: errorMessage.slice(0, 2000),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'song_id,youtube_video_id' }
        )
        .select('*')
        .single()

      if (error) throw error
      return mapDbToDomain(data as LyricSyncRow)
    },
  }
}
