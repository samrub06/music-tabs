import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewSongData, Song, SongEditData, SongSection } from '@/types'
import type { Database } from '@/types/db'
import { parseTextToStructuredSong } from '@/utils/songParser'
import { structuredSongToText } from '@/utils/structuredToText'
import { extractAllChords } from '@/utils/structuredSong'

// Helper to map DB result to Domain Entity
function mapDbSongToDomain(dbSong: Database['public']['Tables']['songs']['Row']): Song {
  // Reconstruct content from sections since it's not stored in DB anymore
  const sections = (dbSong.sections as unknown as SongSection[]) || []
  
  // Create a temporary song object to pass to structuredSongToText
  // We only need sections for the conversion
  const tempSong = { sections } as Song
  const content = structuredSongToText(tempSong)

  return {
    ...dbSong,
    content, // Add the reconstructed content
    folderId: dbSong.folder_id || undefined,
    createdAt: new Date(dbSong.created_at),
    updatedAt: new Date(dbSong.updated_at),
    sections: sections,
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
    viewCount: dbSong.view_count || 0,
    genre: dbSong.genre || undefined,
    decade: dbSong.decade || undefined,
    bpm: dbSong.bpm || undefined,
    allChords: dbSong.all_chords || undefined
  } as Song
}

// Helper to map DB result to lightweight Song for lists (no sections/content)
function mapDbSongToList(dbSong: Partial<Database['public']['Tables']['songs']['Row']>): Song {
  return {
    id: dbSong.id!,
    title: dbSong.title!,
    author: dbSong.author!,
    format: 'structured',
    sections: [], // Empty for lists
    content: '', // Empty for lists
    folderId: dbSong.folder_id || undefined,
    createdAt: new Date(dbSong.created_at!),
    updatedAt: new Date(dbSong.updated_at!),
    version: dbSong.version || undefined,
    versionDescription: dbSong.version_description || undefined,
    rating: dbSong.rating || undefined,
    artistImageUrl: dbSong.artist_image_url || undefined,
    songImageUrl: dbSong.song_image_url || undefined,
    viewCount: dbSong.view_count || 0,
    genre: dbSong.genre || undefined,
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

    // Extract all unique chords from the song
    const allChords = extractAllChords(structuredSong)

    const { data, error } = await (client
      .from('songs') as any)
      .insert([{
        user_id: user?.id!, // RLS should handle this but for now we rely on explicit user check if needed, or simple insert
        title: songData.title,
        author: songData.author,
        // content: songData.content, // Removed as it's not in DB schema
        folder_id: songData.folderId,
        format: 'structured',
        sections: structuredSong.sections as unknown as Database['public']['Tables']['songs']['Insert']['sections'],
        reviews: songData.reviews ?? 0,
        capo: songData.capo ?? null,
        key: songData.key ?? structuredSong.firstChord,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        all_chords: allChords.length > 0 ? allChords : null,
        version: songData.version ?? null,
        version_description: songData.versionDescription ?? null,
        rating: songData.rating ?? null,
        difficulty: songData.difficulty ?? null,
        artist_url: songData.artistUrl ?? null,
        artist_image_url: songData.artistImageUrl ?? null,
        song_image_url: songData.songImageUrl ?? null,
        source_url: songData.sourceUrl ?? null,
        source_site: songData.sourceSite ?? null,
        tab_id: songData.tabId ?? null,
        genre: songData.genre ?? null,
        bpm: songData.bpm ?? null,
        is_trending: false, // Default for user created songs
        is_public: false    // Default for user created songs
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbSongToDomain(data)
  },

  /**
   * Creates a system-owned song (user_id = null) for trending/public songs
   * Bypasses authentication check and allows setting is_trending and is_public flags
   */
  async createSystemSong(
    songData: NewSongData,
    options: { isTrending?: boolean; isPublic?: boolean; genre?: string; decade?: number } = {}
  ): Promise<Song> {
    const structuredSong = parseTextToStructuredSong(
      songData.title,
      songData.author,
      songData.content,
      songData.folderId,
      songData.reviews,
      songData.capo,
      songData.key
    )

    // Extract all unique chords from the song
    const allChords = extractAllChords(structuredSong)

    const { data, error } = await (client
      .from('songs') as any)
      .insert([{
        user_id: null, // System owned
        title: songData.title,
        author: songData.author,
        folder_id: songData.folderId ?? null,
        format: 'structured',
        sections: structuredSong.sections as unknown as Database['public']['Tables']['songs']['Insert']['sections'],
        reviews: songData.reviews ?? 0,
        capo: songData.capo ?? null,
        key: songData.key ?? structuredSong.firstChord,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        all_chords: allChords.length > 0 ? allChords : null,
        version: songData.version ?? null,
        version_description: songData.versionDescription ?? null,
        rating: songData.rating ?? null,
        difficulty: songData.difficulty ?? null,
        artist_url: songData.artistUrl ?? null,
        artist_image_url: songData.artistImageUrl ?? null,
        song_image_url: songData.songImageUrl ?? null,
        source_url: songData.sourceUrl ?? null,
        source_site: songData.sourceSite ?? null,
        tab_id: songData.tabId ?? null,
        bpm: songData.bpm ?? null,
        is_trending: options.isTrending ?? false,
        is_public: options.isPublic ?? false,
        genre: options.genre ?? null,
        decade: options.decade ?? null
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbSongToDomain(data)
  },

  async getSong(id: string): Promise<Song | null> {
    const { data, error } = await client
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching song:', error)
      return null
    }

    return mapDbSongToDomain(data)
  },

  async getSongByTabId(tabId: string): Promise<Song | null> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data, error } = await client
      .from('songs')
      .select('*')
      .eq('tab_id', tabId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no row found, it's not an error, just return null
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching song by tabId:', error)
      return null
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
      // content: updates.content, // Removed as it's not in DB schema
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
      tab_id: updates.tabId ?? null,
      genre: updates.genre ?? null,
      bpm: updates.bpm ?? null
    }
    if (sections) {
      updateData.sections = sections
    }

    const { data, error } = await (client
      .from('songs') as any)
      .update(updateData as any)
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

    const { data, error } = await (client
      .from('songs') as any)
      .update({
        folder_id: folderId || null,
        updated_at: new Date().toISOString()
      } as any)
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

  async getTrendingSongs(): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select('*')
      .eq('is_trending', true)
      .order('created_at', { ascending: false }) // Ou un autre critère de tri si dispo (ex: rating)
      .limit(24)

    if (error) throw error

    return (data || []).map(mapDbSongToDomain)
  },

  async getTrendingSongsPaged(
    page: number, 
    limit: number, 
    q?: string,
    genre?: string,
    difficulty?: string,
    decade?: number
  ): Promise<{ songs: Song[]; total: number }> {
    const from = (page - 1) * limit
    const to = page * limit - 1
    let builder = (client.from('songs') as any)
      .select('*', { count: 'exact' })
      .or('is_trending.eq.true,is_public.eq.true')
      .order('created_at', { ascending: false })
    
    // Appliquer les filtres
    if (genre) {
      builder = builder.eq('genre', genre)
    }
    if (difficulty) {
      builder = builder.eq('difficulty', difficulty)
    }
    if (decade) {
      builder = builder.eq('decade', decade)
    }
    
    if (q && q.trim()) {
      const query = q.trim()
      builder = builder.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    }
    const { data, error, count } = await builder.range(from, to)

    if (error) throw error
    return { songs: (data || []).map(mapDbSongToDomain), total: count || 0 }
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
      // Si pas user, on peut chercher dans les chansons publiques ? 
      // Pour l'instant on garde le comportement existant (vide si pas user)
      return []
    }

    const { data, error } = await dbQuery
    if (error) throw error

    return (data || []).map(mapDbSongToDomain)
  },

  async getRecentSongs(limit: number = 15): Promise<Song[]> {
    let builder = (client.from('songs') as any)
      .select('*')
      .or('is_trending.eq.true,is_public.eq.true')
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await builder

    if (error) throw error
    return (data || []).map(mapDbSongToDomain)
  },

  async getPopularSongs(limit: number = 15): Promise<Song[]> {
    let builder = (client.from('songs') as any)
      .select('*')
      .or('is_trending.eq.true,is_public.eq.true')
      .not('view_count', 'is', null)
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(limit)

    const { data, error } = await builder

    if (error) throw error
    return (data || []).map(mapDbSongToDomain)
  },

  // Lightweight methods for library page - no sections/content
  async getTrendingSongsLightweight(): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select('id, title, author, folder_id, created_at, updated_at, rating, artist_image_url, song_image_url, view_count, version, version_description, genre')
      .eq('is_trending', true)
      .order('created_at', { ascending: false })
      .limit(24)

    if (error) throw error
    return (data || []).map(mapDbSongToList)
  },

  async getRecentSongsLightweight(limit: number = 15): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select('id, title, author, folder_id, created_at, updated_at, rating, artist_image_url, song_image_url, view_count, version, version_description, genre')
      .or('is_trending.eq.true,is_public.eq.true')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(mapDbSongToList)
  },

  async getPopularSongsLightweight(limit: number = 15): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select('id, title, author, folder_id, created_at, updated_at, rating, artist_image_url, song_image_url, view_count, version, version_description, genre')
      .or('is_trending.eq.true,is_public.eq.true')
      .not('view_count', 'is', null)
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(mapDbSongToList)
  }
})
