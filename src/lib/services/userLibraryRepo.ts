import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Song } from '@/types'
import { songRepo } from '@/lib/services/songRepo'

/** Reserved playlist name used only if user_library.is_liked column is missing. */
export const LIKES_PLAYLIST_NAME = '__tabasco_likes__'

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
  is_liked?: boolean | null
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

let likesColumnAvailable: boolean | null = null

async function detectLikesColumn(client: SupabaseClient<any>): Promise<boolean> {
  if (likesColumnAvailable != null) return likesColumnAvailable
  const { error } = await client.from('user_library').select('is_liked').limit(1)
  likesColumnAvailable = !error
  return likesColumnAvailable
}

export const userLibraryRepo = (client: SupabaseClient<Database>) => {
  const table = () => (client as SupabaseClient<any>).from('user_library')
  const playlists = () => (client as SupabaseClient<any>).from('playlists')

  async function getOrCreateLikesPlaylist(userId: string): Promise<{
    id: string
    song_ids: string[]
  }> {
    const { data: existing, error } = await playlists()
      .select('id, song_ids')
      .eq('user_id', userId)
      .eq('name', LIKES_PLAYLIST_NAME)
      .maybeSingle()
    if (error) throw error
    if (existing) {
      return {
        id: existing.id,
        song_ids: Array.isArray(existing.song_ids) ? existing.song_ids : [],
      }
    }
    const { data: created, error: createError } = await playlists()
      .insert({
        user_id: userId,
        name: LIKES_PLAYLIST_NAME,
        song_ids: [],
        description: 'System: liked songs (temporary until user_library.is_liked)',
      })
      .select('id, song_ids')
      .single()
    if (createError) throw createError
    return {
      id: created.id,
      song_ids: Array.isArray(created.song_ids) ? created.song_ids : [],
    }
  }

  async function listLikedSongIdsFallback(userId: string): Promise<Set<string>> {
    const { data, error } = await playlists()
      .select('song_ids')
      .eq('user_id', userId)
      .eq('name', LIKES_PLAYLIST_NAME)
      .maybeSingle()
    if (error) throw error
    const ids = Array.isArray(data?.song_ids) ? (data.song_ids as string[]) : []
    return new Set(ids)
  }

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
      if (!data) return null
      const entry = mapRow(data)
      if (!(await detectLikesColumn(client as SupabaseClient<any>))) {
        const liked = await listLikedSongIdsFallback(userId)
        entry.isLiked = liked.has(songId)
      }
      return entry
    },

    async listByUser(userId: string): Promise<UserLibraryEntry[]> {
      const { data, error } = await table()
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const entries = (data || []).map(mapRow)
      if (!(await detectLikesColumn(client as SupabaseClient<any>))) {
        const liked = await listLikedSongIdsFallback(userId)
        for (const e of entries) e.isLiked = liked.has(e.songId)
      }
      return entries
    },

    async listLikedSongIds(userId: string): Promise<string[]> {
      if (await detectLikesColumn(client as SupabaseClient<any>)) {
        const { data, error } = await table()
          .select('song_id')
          .eq('user_id', userId)
          .eq('is_liked', true)
        if (error) throw error
        return ((data || []) as Array<{ song_id: string }>).map((r) => r.song_id)
      }
      return Array.from(await listLikedSongIdsFallback(userId))
    },

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
        if (String(error.message || '').includes('user_library') || error.code === '42P01') {
          return []
        }
        throw error
      }
      const entries = (data || []).map(mapRow)
      if (!(await detectLikesColumn(client as SupabaseClient<any>))) {
        const liked = await listLikedSongIdsFallback(userId)
        for (const e of entries) e.isLiked = liked.has(e.songId)
      }
      return entries
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
          await this.toggleLike(input.userId, input.songId)
          const refreshed = await this.getByUserAndSong(input.userId, input.songId)
          return refreshed ?? existing
        }
        return existing
      }

      const hasCol = await detectLikesColumn(client as SupabaseClient<any>)
      const insertPayload: Record<string, unknown> = {
        user_id: input.userId,
        song_id: input.songId,
        folder_id: input.folderId ?? null,
      }
      if (hasCol) insertPayload.is_liked = input.isLiked ?? false

      const { data, error } = await table().insert(insertPayload).select('*').single()
      if (error) throw error
      const entry = mapRow(data)
      if (!hasCol && input.isLiked) {
        await this.toggleLike(input.userId, input.songId)
        entry.isLiked = true
      }
      return entry
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

    async setLiked(entryId: string, isLiked: boolean): Promise<UserLibraryEntry> {
      const { data, error } = await table()
        .update({
          is_liked: isLiked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select('*')
        .single()
      if (error) throw error
      return mapRow(data)
    },

    async toggleLike(userId: string, songId: string): Promise<boolean> {
      const hasCol = await detectLikesColumn(client as SupabaseClient<any>)

      if (hasCol) {
        const existing = await this.getByUserAndSong(userId, songId)
        if (existing) {
          const next = !existing.isLiked
          await this.setLiked(existing.id, next)
          return next
        }
        await this.add({ userId, songId, isLiked: true })
        return true
      }

      // Fallback until db/add-user-library-is-liked.sql is applied
      const playlist = await getOrCreateLikesPlaylist(userId)
      const set = new Set(playlist.song_ids)
      const next = !set.has(songId)
      if (next) set.add(songId)
      else set.delete(songId)
      const { error } = await playlists()
        .update({
          song_ids: Array.from(set),
          updated_at: new Date().toISOString(),
        })
        .eq('id', playlist.id)
      if (error) throw error

      if (next) {
        const existing = await this.getByUserAndSong(userId, songId)
        if (!existing) {
          await this.add({ userId, songId })
        }
      }
      return next
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
