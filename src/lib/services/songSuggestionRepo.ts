import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export type SongEditSuggestionStatus = 'pending' | 'accepted' | 'rejected'

export interface SongEditSuggestion {
  id: string
  catalogSongId: string
  fromUserId: string
  fromSongId: string
  message: string
  status: SongEditSuggestionStatus
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  catalogTitle?: string
  catalogAuthor?: string
  fromSongTitle?: string
  fromUserEmail?: string
}

function mapRow(
  row: Database['public']['Tables']['song_edit_suggestions']['Row'] & {
    catalog?: { title?: string | null; author?: string | null } | null
    from_song?: { title?: string | null } | null
  }
): SongEditSuggestion {
  return {
    id: row.id,
    catalogSongId: row.catalog_song_id,
    fromUserId: row.from_user_id,
    fromSongId: row.from_song_id,
    message: row.message || '',
    status: row.status as SongEditSuggestionStatus,
    createdAt: new Date(row.created_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by || undefined,
    catalogTitle: row.catalog?.title || undefined,
    catalogAuthor: row.catalog?.author || undefined,
    fromSongTitle: row.from_song?.title || undefined,
  }
}

export const songSuggestionRepo = (client: SupabaseClient<Database>) => ({
  async create(input: {
    catalogSongId: string
    fromUserId: string
    fromSongId: string
    message: string
  }): Promise<SongEditSuggestion> {
    const { data, error } = await (client.from('song_edit_suggestions') as any)
      .insert([
        {
          catalog_song_id: input.catalogSongId,
          from_user_id: input.fromUserId,
          from_song_id: input.fromSongId,
          message: input.message,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (error) throw error
    return mapRow(data)
  },

  async listPending(): Promise<SongEditSuggestion[]> {
    const { data, error } = await (client.from('song_edit_suggestions') as any)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data || []) as Database['public']['Tables']['song_edit_suggestions']['Row'][]
    const songIds = Array.from(
      new Set(rows.flatMap((r) => [r.catalog_song_id, r.from_song_id]))
    )
    let titleById = new Map<string, { title: string; author: string | null }>()
    if (songIds.length > 0) {
      const { data: songs } = await (client.from('songs') as any)
        .select('id, title, author')
        .in('id', songIds)
      for (const s of songs || []) {
        titleById.set(s.id, { title: s.title, author: s.author })
      }
    }

    return rows.map((row) => {
      const mapped = mapRow(row)
      const catalog = titleById.get(row.catalog_song_id)
      const fromSong = titleById.get(row.from_song_id)
      return {
        ...mapped,
        catalogTitle: catalog?.title,
        catalogAuthor: catalog?.author || undefined,
        fromSongTitle: fromSong?.title,
      }
    })
  },

  async review(
    suggestionId: string,
    status: 'accepted' | 'rejected',
    reviewedBy: string
  ): Promise<SongEditSuggestion> {
    const { data, error } = await (client.from('song_edit_suggestions') as any)
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
      })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) throw error
    return mapRow(data)
  },
})
