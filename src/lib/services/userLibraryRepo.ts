import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Song } from '@/types'
import { songRepo } from '@/lib/services/songRepo'

export type UserLibraryEntry = {
  id: string
  userId: string
  songId: string
  folderId?: string
  createdAt: Date
  updatedAt: Date
}

function mapRow(row: {
  id: string
  user_id: string
  song_id: string
  folder_id: string | null
  created_at: string
  updated_at: string
}): UserLibraryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    songId: row.song_id,
    folderId: row.folder_id || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export const userLibraryRepo = (client: SupabaseClient<Database>) => {
  const table = () => (client as SupabaseClient<any>).from('user_library')

  return {
    async getByUserAndSong(
      userId: string,
      songId: string
    ): Promise<UserLibraryEntry | null> {
      const { data, error } = await table()
        .select('*')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle()
      if (error) throw error
      return data ? mapRow(data) : null
    },

    async listByUser(userId: string): Promise<UserLibraryEntry[]> {
      const { data, error } = await table()
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map(mapRow)
    },

    /**
     * List library links, optionally filtered by folder.
     * `folderId === 'unorganized'` → folder_id IS NULL
     * `folderId` uuid → that folder
     * omitted → all folders
     */
    async listByUserWithFolderFilter(
      userId: string,
      folderId?: string
    ): Promise<UserLibraryEntry[]> {
      let query = table().select('*').eq('user_id', userId)
      if (folderId === 'unorganized') {
        query = query.is('folder_id', null)
      } else if (folderId) {
        query = query.eq('folder_id', folderId)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) {
        // Table missing / migration not applied — dual-read degrades to personal-only
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
    }): Promise<UserLibraryEntry> {
      const existing = await this.getByUserAndSong(input.userId, input.songId)
      if (existing) {
        if (input.folderId !== undefined && input.folderId !== existing.folderId) {
          return this.updateFolder(existing.id, input.folderId)
        }
        return existing
      }

      const { data, error } = await table()
        .insert({
          user_id: input.userId,
          song_id: input.songId,
          folder_id: input.folderId ?? null,
        })
        .select('*')
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
        .select('*')
        .single()
      if (error) throw error
      return mapRow(data)
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
        .select('*')
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

    /**
     * Set folder_id on library links for the given song ids.
     * Returns how many link rows were updated.
     */
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

    /**
     * Songs reachable via library links (catalog or forks), excluding song ids
     * already present in `excludeSongIds` (legacy personal copies).
     */
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
      // Batch in chunks of 50
      for (let i = 0; i < songIds.length; i += 50) {
        const chunk = songIds.slice(i, i + 50)
        const { data, error } = await (client.from('songs') as any)
          .select('*')
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

/**
 * Add catalog (or any) song to library via link — no content clone.
 */
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
