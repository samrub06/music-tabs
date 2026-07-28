import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Song } from '@/types'
import { songRepo } from '@/lib/services/songRepo'

/**
 * Per-user membership for catalog (and personal) songs.
 * Folder placement and likes live here — never on catalog `songs` rows.
 */
export type UserLibraryEntry = {
  id: string
  userId: string
  songId: string
  folderId?: string
  isLiked: boolean
  createdAt: Date
  updatedAt: Date
}

function mapRow(row: {
  id: string
  user_id: string
  song_id: string
  folder_id: string | null
  is_liked: boolean
  created_at: string
  updated_at: string
}): UserLibraryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    songId: row.song_id,
    folderId: row.folder_id || undefined,
    isLiked: row.is_liked === true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

const LIBRARY_COLUMNS =
  'id, user_id, song_id, folder_id, is_liked, created_at, updated_at'

export const userLibraryRepo = (client: SupabaseClient<Database>) => {
  const table = () => (client as SupabaseClient<any>).from('user_library')

  return {
    async getByUserAndSong(
      userId: string,
      songId: string
    ): Promise<UserLibraryEntry | null> {
      const { data, error } = await table()
        .select(LIBRARY_COLUMNS)
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return mapRow(data)
    },

    async listByUser(userId: string): Promise<UserLibraryEntry[]> {
      const { data, error } = await table()
        .select(LIBRARY_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map(mapRow)
    },

    async listLikedSongIds(userId: string): Promise<string[]> {
      const { data, error } = await table()
        .select('song_id')
        .eq('user_id', userId)
        .eq('is_liked', true)
      if (error) throw error
      return ((data || []) as Array<{ song_id: string }>).map((r) => r.song_id)
    },

    async listByUserWithFolderFilter(
      userId: string,
      folderId?: string
    ): Promise<UserLibraryEntry[]> {
      let query = table().select(LIBRARY_COLUMNS).eq('user_id', userId)
      if (folderId === 'unorganized') {
        query = query.is('folder_id', null)
      } else if (folderId) {
        query = query.eq('folder_id', folderId)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) {
        if (String(error.message || '').includes('user_library') || error.code === '42P01') {
          return []
        }
        throw error
      }
      return (data || []).map(mapRow)
    },

    async add(input: {
      userId: string
      songId: string
      folderId?: string | null
      isLiked?: boolean
    }): Promise<UserLibraryEntry> {
      const existing = await this.getByUserAndSong(input.userId, input.songId)
      if (existing) {
        if (input.folderId !== undefined && input.folderId !== existing.folderId) {
          return this.updateFolder(existing.id, input.folderId)
        }
        if (input.isLiked !== undefined && input.isLiked !== existing.isLiked) {
          await this.setLiked(existing.id, input.isLiked)
          const refreshed = await this.getByUserAndSong(input.userId, input.songId)
          return refreshed ?? existing
        }
        return existing
      }

      const { data, error } = await table()
        .insert({
          user_id: input.userId,
          song_id: input.songId,
          folder_id: input.folderId ?? null,
          is_liked: input.isLiked ?? false,
        })
        .select(LIBRARY_COLUMNS)
        .single()
      if (error) throw error
      return mapRow(data)
    },

    async updateFolder(
      entryId: string,
      folderId?: string | null
    ): Promise<UserLibraryEntry> {
      const { data, error } = await table()
        .update({
          folder_id: folderId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select(LIBRARY_COLUMNS)
        .single()
      if (error) throw error
      return mapRow(data)
    },

    async setLiked(entryId: string, isLiked: boolean): Promise<UserLibraryEntry> {
      const { data, error } = await table()
        .update({
          is_liked: isLiked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select(LIBRARY_COLUMNS)
        .single()
      if (error) throw error
      return mapRow(data)
    },

    async toggleLike(userId: string, songId: string): Promise<boolean> {
      const existing = await this.getByUserAndSong(userId, songId)
      if (existing) {
        const next = !existing.isLiked
        await this.setLiked(existing.id, next)
        return next
      }
      await this.add({ userId, songId, isLiked: true })
      return true
    },

    async retargetSong(
      entryId: string,
      newSongId: string
    ): Promise<UserLibraryEntry> {
      const { data, error } = await table()
        .update({
          song_id: newSongId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select(LIBRARY_COLUMNS)
        .single()
      if (error) throw error
      return mapRow(data)
    },

    async remove(userId: string, songId: string): Promise<void> {
      const { error } = await table()
        .delete()
        .eq('user_id', userId)
        .eq('song_id', songId)
      if (error) throw error
    },

    async removeBySongIds(userId: string, songIds: string[]): Promise<number> {
      const uniqueIds = Array.from(new Set(songIds))
      if (uniqueIds.length === 0) return 0

      let removed = 0
      const chunkSize = 100
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize)
        const { data, error } = await table()
          .delete()
          .eq('user_id', userId)
          .in('song_id', chunk)
          .select('id')
        if (error) throw error
        removed += Array.isArray(data) ? data.length : 0
      }
      return removed
    },

    async removeAllForUser(userId: string): Promise<void> {
      const { error } = await table().delete().eq('user_id', userId)
      if (error) throw error
    },

    async assignFolderForSongIds(
      userId: string,
      folderId: string | null,
      songIds: string[],
      chunkSize = 100
    ): Promise<number> {
      const uniqueIds = Array.from(new Set(songIds))
      if (uniqueIds.length === 0) return 0

      const updatedAt = new Date().toISOString()
      let updated = 0

      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize)
        const { data, error } = await table()
          .update({
            folder_id: folderId,
            updated_at: updatedAt,
          })
          .eq('user_id', userId)
          .in('song_id', chunk)
          .select('id')
        if (error) throw error
        updated += Array.isArray(data) ? data.length : 0
      }

      return updated
    },

    async getLinkedSongsForUser(
      userId: string,
      excludeSongIds: Set<string> = new Set()
    ): Promise<Song[]> {
      const entries = await this.listByUser(userId)
      const songIds = entries
        .map((e) => e.songId)
        .filter((id) => !excludeSongIds.has(id))
      if (songIds.length === 0) return []

      const repo = songRepo(client)
      const songs: Song[] = []
      for (let i = 0; i < songIds.length; i += 50) {
        const chunk = songIds.slice(i, i + 50)
        const { data, error } = await (client as SupabaseClient<any>)
          .from('songs')
          .select('id')
          .in('id', chunk)
        if (error) throw error
        for (const row of data || []) {
          const song = await repo.getSong(row.id)
          if (song) songs.push(song)
        }
      }
      return songs
    },
  }
}

export async function addSongToUserLibrary(
  client: SupabaseClient<Database>,
  input: { userId: string; songId: string; folderId?: string | null }
): Promise<{ entry: UserLibraryEntry; song: Song }> {
  const repo = songRepo(client)
  const song = await repo.getSong(input.songId)
  if (!song) throw new Error('Song not found')

  const entry = await userLibraryRepo(client).add({
    userId: input.userId,
    songId: input.songId,
    folderId: input.folderId,
  })
  return { entry, song }
}
