import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewSongData, Song, SongEditData, SongSection } from '@/types'
import type { Database } from '@/types/db'
import { parseTextToStructuredSong } from '@/utils/songParser'

// Helper to map DB result to Domain Entity
function mapDbSongToDomain(dbSong: Database['public']['Tables']['songs']['Row']): Song {
  return {
    ...dbSong,
    folderId: dbSong.folder_id || undefined,
    createdAt: new Date(dbSong.created_at),
    updatedAt: new Date(dbSong.updated_at),
    sections: (dbSong.sections as unknown as SongSection[]) || [],
    reviews: dbSong.reviews || undefined,
    capo: dbSong.capo || undefined,
    key: dbSong.key || undefined,
    soundingKey: dbSong.sounding_key || undefined,
    firstChord: dbSong.first_chord || undefined,
    lastChord: dbSong.last_chord || undefined,
    chordProgression: dbSong.chord_progression || undefined,
    version: dbSong.version || undefined,
    versionDescription: dbSong.version_description || undefined,
    rating: dbSong.rating || undefined,
    difficulty: dbSong.difficulty || undefined,
    artistUrl: dbSong.artist_url || undefined,
    artistImageUrl: dbSong.artist_image_url || undefined,
    songImageUrl: dbSong.song_image_url || undefined,
    sourceUrl: dbSong.source_url || undefined,
    sourceSite: dbSong.source_site || undefined,
    tabId: dbSong.tab_id || undefined,
    viewCount: dbSong.view_count || 0
  } as Song
}

export const songRepo = (client: SupabaseClient<Database>) => ({
  async createSong(songData: NewSongData): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()

    const structuredSong = parseTextToStructuredSong(
      songData.title,
      songData.author,
      songData.content,
      songData.folderId,
      songData.reviews,
      songData.capo,
      songData.key
    )

    const { data, error } = await client
      .from('songs')
      .insert([{
        user_id: user?.id!, // RLS should handle this but for now we rely on explicit user check if needed, or simple insert
        title: songData.title,
        author: songData.author,
        content: songData.content,
        folder_id: songData.folderId,
        format: 'structured',
        sections: structuredSong.sections as unknown as Database['public']['Tables']['songs']['Insert']['sections'],
        reviews: songData.reviews ?? 0,
        capo: songData.capo ?? null,
        key: songData.key ?? structuredSong.firstChord,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        version: songData.version ?? null,
        version_description: songData.versionDescription ?? null,
        rating: songData.rating ?? null,
        difficulty: songData.difficulty ?? null,
        artist_url: songData.artistUrl ?? null,
        artist_image_url: songData.artistImageUrl ?? null,
        song_image_url: songData.songImageUrl ?? null,
        source_url: songData.sourceUrl ?? null,
        source_site: songData.sourceSite ?? null,
        tab_id: songData.tabId ?? null
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbSongToDomain(data)
  },

  async updateSong(id: string, updates: SongEditData): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to update songs')
    }

    let sections = undefined as any
    if (updates.content) {
      const structuredSong = parseTextToStructuredSong(
        updates.title,
        updates.author,
        updates.content,
        updates.folderId
      )
      sections = structuredSong.sections
    }

    const updateData: Database['public']['Tables']['songs']['Update'] = {
      title: updates.title,
      author: updates.author,
      content: updates.content, // ensure content is updated too
      folder_id: updates.folderId,
      updated_at: new Date().toISOString(),
      version: updates.version ?? null,
      version_description: updates.versionDescription ?? null,
      rating: updates.rating ?? null,
      difficulty: updates.difficulty ?? null,
      artist_url: updates.artistUrl ?? null,
      artist_image_url: updates.artistImageUrl ?? null,
      song_image_url: updates.songImageUrl ?? null,
      source_url: updates.sourceUrl ?? null,
      source_site: updates.sourceSite ?? null,
      tab_id: updates.tabId ?? null
    }
    if (sections) {
      updateData.sections = sections
    }

    const { data, error } = await client
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbSongToDomain(data)
  },

  async updateSongFolder(id: string, folderId?: string): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to update songs')
    }

    const { data, error } = await client
      .from('songs')
      .update({
        folder_id: folderId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbSongToDomain(data)
  },

  async deleteSong(id: string): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }

    const { error } = await client.from('songs').delete().eq('id', id)
    if (error) {
      throw error
    }
  },

  async deleteSongs(ids: string[]): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }
    if (ids.length === 0) return
    const { error } = await client.from('songs').delete().in('id', ids)
    if (error) {
      throw error
    }
  },

  async deleteAllSongs(): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }
    const { error } = await client.from('songs').delete().eq('user_id', user.id)
    if (error) {
      throw error
    }
  },

  async getAllSongs(): Promise<Song[]> {
    const { data: { user } } = await client.auth.getUser()
    
    let query = client
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      return []
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map(mapDbSongToDomain)
  },

  async searchSongs(query: string): Promise<Song[]> {
    const { data: { user } } = await client.auth.getUser()
    
    let dbQuery = client
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (user) {
      dbQuery = dbQuery.eq('user_id', user.id)
    } else {
      return []
    }

    const { data, error } = await dbQuery
    if (error) throw error

    return (data || []).map(mapDbSongToDomain)
  }
})
