import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewSongData, Song, SongEditData, SongSection } from '@/types'
import type { Database } from '@/types/db'
import { parseTextToStructuredSong } from '@/utils/songParser'
import { structuredSongToText } from '@/utils/structuredToText'
import { extractAllChords, extractChordMetadataFromSections } from '@/utils/structuredSong'
import { fetchAllSongIdsFromQuery } from '@/lib/services/songListFilters'
import { dedupeCatalogSongs } from '@/lib/utils/catalogSongDedup'
import { FEATURED_CATALOG_SONG_SLUG } from '@/data/featuredCatalogSong'

// Helper to map DB result to Domain Entity
function mapDbSongToDomain(dbSong: Database['public']['Tables']['songs']['Row']): Song {
  const sections = (dbSong.sections as unknown as SongSection[]) || []

  return {
    ...dbSong,
    content: '', // Sections are source of truth; use renderStructuredSong() when text is needed
    userId: dbSong.user_id || undefined,
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
    allChords: dbSong.all_chords || undefined,
    isLiked: dbSong.is_liked ?? false,
    isPublic: dbSong.is_public ?? false,
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
    tabId: dbSong.tab_id || undefined,
    sourceUrl: dbSong.source_url || undefined,
    isLiked: dbSong.is_liked ?? false,
    difficulty: dbSong.difficulty || undefined,
    decade: dbSong.decade || undefined,
    capo: dbSong.capo ?? undefined,
  } as Song
}

const LIGHTWEIGHT_LIST_COLUMNS =
  'id, title, author, folder_id, created_at, updated_at, rating, artist_image_url, song_image_url, view_count, version, version_description, genre, tab_id, source_url, is_liked'

const PUBLIC_PLAYLIST_LIST_COLUMNS =
  'id, title, author, song_image_url, artist_image_url, genre, key'

/** PostgREST `.in()` via GET breaks on very large playlists (URL length). */
const PUBLIC_PLAYLIST_ID_CHUNK_SIZE = 100

const LIBRARY_LIST_COLUMNS =
  'id, title, author, folder_id, created_at, updated_at, rating, artist_image_url, song_image_url, view_count, version, version_description, genre, is_liked, key, capo, difficulty'

const SIDEBAR_SONG_COLUMNS =
  'id, title, author, folder_id, created_at, updated_at, view_count'

const EXPLORE_LIST_COLUMNS =
  `${LIGHTWEIGHT_LIST_COLUMNS}, difficulty, decade, capo, is_trending, is_public`

export const songRepo = (client: SupabaseClient<Database>) => ({
  async findExistingSystemCatalogSong(match: {
    tabId?: number | string | null
    sourceUrl?: string | null
    title: string
    author: string
  }): Promise<{ id: string } | null> {
    if (match.tabId != null && match.tabId !== '') {
      const { data } = await (client.from('songs') as any)
        .select('id')
        .eq('tab_id', String(match.tabId))
        .is('user_id', null)
        .limit(1)
        .maybeSingle()
      if (data?.id) return { id: data.id }
    }

    const sourceUrl = match.sourceUrl?.trim()
    if (sourceUrl) {
      const { data } = await (client.from('songs') as any)
        .select('id')
        .eq('source_url', sourceUrl)
        .is('user_id', null)
        .limit(1)
        .maybeSingle()
      if (data?.id) return { id: data.id }
    }

    const { data: byTitle } = await (client.from('songs') as any)
      .select('id')
      .ilike('title', match.title.trim())
      .ilike('author', match.author.trim())
      .is('user_id', null)
      .limit(1)
      .maybeSingle()

    return byTitle?.id ? { id: byTitle.id } : null
  },

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

    let sections: SongSection[] | undefined
    let chordMetadata: ReturnType<typeof extractChordMetadataFromSections> | undefined

    if (updates.sections && updates.sections.length > 0) {
      sections = updates.sections
      chordMetadata = extractChordMetadataFromSections(sections)
    } else if (updates.content) {
      const structuredSong = parseTextToStructuredSong(
        updates.title,
        updates.author,
        updates.content,
        updates.folderId
      )
      sections = structuredSong.sections
      chordMetadata = {
        allChords: extractAllChords(structuredSong),
        firstChord: structuredSong.firstChord,
        lastChord: structuredSong.lastChord,
      }
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
      updateData.sections = sections as unknown as Database['public']['Tables']['songs']['Update']['sections']
    }
    if (chordMetadata) {
      updateData.all_chords = chordMetadata.allChords.length > 0 ? chordMetadata.allChords : null
      updateData.first_chord = chordMetadata.firstChord ?? null
      updateData.last_chord = chordMetadata.lastChord ?? null
      if (!updates.key && chordMetadata.firstChord) {
        updateData.key = chordMetadata.firstChord
      }
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

  async toggleSongLike(id: string): Promise<boolean> {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to favorite songs')
    }

    const { data: current, error: fetchError } = await (client
      .from('songs') as any)
      .select('is_liked')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !current) {
      throw fetchError ?? new Error('Song not found')
    }

    const nextLiked = !(current as { is_liked: boolean }).is_liked

    const { error: updateError } = await (client.from('songs') as any)
      .update({
        is_liked: nextLiked,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return nextLiked
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
      .is('user_id', null)
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

    const applyCatalogFilters = (builder: any) => {
      let filtered = builder
        .or('is_trending.eq.true,is_public.eq.true')
        .is('user_id', null)

      if (genre) filtered = filtered.eq('genre', genre)
      if (difficulty) filtered = filtered.eq('difficulty', difficulty)
      if (decade) filtered = filtered.eq('decade', decade)

      if (q?.trim()) {
        const query = q.trim()
        filtered = filtered.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      }
      return filtered
    }

    const dataQuery = applyCatalogFilters(
      (client.from('songs') as any)
        .select(EXPLORE_LIST_COLUMNS)
        .order('created_at', { ascending: false })
    )
    const countQuery = applyCatalogFilters(
      (client.from('songs') as any).select('id', { count: 'planned', head: true })
    )

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      dataQuery.range(from, to),
      countQuery,
    ])

    if (error) throw error
    if (countError) throw countError

    return { songs: (data || []).map(mapDbSongToList), total: count ?? 0 }
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
  async getFeaturedCatalogSongLightweight(): Promise<Song | null> {
    const { data, error } = await client
      .from('songs')
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .eq('tab_id', `curated:${FEATURED_CATALOG_SONG_SLUG}`)
      .is('user_id', null)
      .maybeSingle()

    if (error) throw error
    return data ? mapDbSongToList(data) : null
  },

  async getTrendingSongsLightweight(): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .eq('is_trending', true)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(24)

    if (error) throw error
    return (data || []).map(mapDbSongToList)
  },

  async getRecentSongsLightweight(limit: number = 15): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .or('is_trending.eq.true,is_public.eq.true')
      .is('user_id', null)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return dedupeCatalogSongs(data || []).map(mapDbSongToList)
  },

  async getPopularSongsLightweight(limit: number = 15): Promise<Song[]> {
    const { data, error } = await client
      .from('songs')
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .or('is_trending.eq.true,is_public.eq.true')
      .is('user_id', null)
      .not('view_count', 'is', null)
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return dedupeCatalogSongs(data || []).map(mapDbSongToList)
  },

  async getSongLightweightById(id: string): Promise<Song | null> {
    const { data, error } = await client
      .from('songs')
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapDbSongToList(data) : null
  },

  async getPublicSongsByAuthorLightweight(
    author: string,
    limit: number = 15,
    excludeSongId?: string
  ): Promise<Song[]> {
    const trimmed = author.trim()
    if (!trimmed) return []

    let builder = (client.from('songs') as any)
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .or('is_trending.eq.true,is_public.eq.true')
      .ilike('author', trimmed)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (excludeSongId) {
      builder = builder.neq('id', excludeSongId)
    }

    const { data, error } = await builder
    if (error) throw error
    return (data || []).map(mapDbSongToList)
  },

  async getUserSongsByAuthorLightweight(author: string, limit: number = 15): Promise<Song[]> {
    const trimmed = author.trim()
    if (!trimmed) return []

    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) return []

    const { data, error } = await (client.from('songs') as any)
      .select(LIGHTWEIGHT_LIST_COLUMNS)
      .eq('user_id', user.id)
      .ilike('author', trimmed)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(mapDbSongToList)
  },

  async getMergedArtistSongsLightweight(
    author: string,
    limit: number = 15
  ): Promise<Song[]> {
    const trimmed = author.trim()
    if (!trimmed) return []

    const [userSongs, publicSongs] = await Promise.all([
      this.getUserSongsByAuthorLightweight(trimmed, limit),
      this.getPublicSongsByAuthorLightweight(trimmed, limit),
    ])

    const seen = new Set<string>()
    const merged: Song[] = []

    for (const song of [...userSongs, ...publicSongs]) {
      const key = song.tabId
        ? `tab:${song.tabId}`
        : `meta:${song.title.toLowerCase().trim()}|${song.author.toLowerCase().trim()}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(song)
      if (merged.length >= limit) break
    }

    return merged
  },

  // Lightweight method for checking existing songs (only needed fields)
  async getAllSongsLightweight(): Promise<Pick<Song, 'id' | 'tabId' | 'sourceUrl' | 'title' | 'author'>[]> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await (client
      .from('songs') as any)
      .select('id, tab_id, source_url, title, author')
      .eq('user_id', user.id)

    if (error) throw error

    return (data || []).map((dbSong: any) => ({
      id: dbSong.id,
      tabId: dbSong.tab_id || undefined,
      sourceUrl: dbSong.source_url || undefined,
      title: dbSong.title,
      author: dbSong.author || '',
    }))
  },

  // Get songs by folder with pagination and search
  async getSongsByFolder(
    folderId: string,
    page: number = 1,
    limit: number = 50,
    q?: string,
    userId?: string
  ): Promise<{ songs: Song[]; total: number }> {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return { songs: [], total: 0 }
      resolvedUserId = user.id
    }

    const from = (page - 1) * limit
    const to = page * limit - 1

    const applyFilters = (builder: any) => {
      let filtered = builder.eq('user_id', resolvedUserId).eq('folder_id', folderId)
      if (q?.trim()) {
        const query = q.trim()
        filtered = filtered.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      }
      return filtered
    }

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      applyFilters((client.from('songs') as any).select(LIBRARY_LIST_COLUMNS))
        .order('created_at', { ascending: false })
        .range(from, to),
      applyFilters((client.from('songs') as any).select('id', { count: 'planned', head: true })),
    ])

    if (error) throw error
    if (countError) throw countError

    return {
      songs: (data || []).map(mapDbSongToList),
      total: count ?? 0,
    }
  },

  async getAllSongIdsByFolder(folderId: string, q?: string): Promise<string[]> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) return []

    let baseQuery = (client.from('songs') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('folder_id', folderId)

    if (q?.trim()) {
      const query = q.trim()
      baseQuery = baseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    }

    return fetchAllSongIdsFromQuery(baseQuery, 'created_at')
  },

  // Lightweight method for playlist generation (no sections/content needed)
  async getAllSongsForPlaylist(): Promise<Song[]> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await (client.from('songs') as any)
      .select('id, title, author, folder_id, genre, key, first_chord, last_chord, song_image_url, artist_image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((dbSong: any) => ({
      id: dbSong.id,
      title: dbSong.title,
      author: dbSong.author || '',
      folderId: dbSong.folder_id || undefined,
      genre: dbSong.genre || undefined,
      songImageUrl: dbSong.song_image_url || undefined,
      artistImageUrl: dbSong.artist_image_url || undefined,
      key: dbSong.key || undefined,
      firstChord: dbSong.first_chord || undefined,
      lastChord: dbSong.last_chord || undefined,
      format: 'structured' as const,
      sections: [],
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Song))
  },

  // Sidebar: metadata only (no sections/content) for folder counts and recent/popular lists
  async getSongsForSidebar(): Promise<Song[]> {
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await (client.from('songs') as any)
      .select(SIDEBAR_SONG_COLUMNS)
      .eq('user_id', user.id)

    if (error) throw error

    return (data || []).map((dbSong: any) => mapDbSongToList(dbSong))
  },

  // Lightweight method for fetching songs by IDs (for playlists, etc.)
  async getSongsByIds(songIds: string[]): Promise<Song[]> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user || songIds.length === 0) {
      return []
    }

    const { data, error } = await (client.from('songs') as any)
      .select(LIBRARY_LIST_COLUMNS)
      .eq('user_id', user.id)
      .in('id', songIds)

    if (error) throw error

    // Create a map for quick lookup, preserving key field
    const songMap = new Map((data || []).map((dbSong: any) => {
      const mappedSong = mapDbSongToList(dbSong)
      // Add key field which is needed for playlist display but not in mapDbSongToList
      return [
        dbSong.id,
        {
          ...mappedSong,
          key: dbSong.key || undefined
        }
      ]
    }))

    // Return songs in the same order as songIds, filtering out any missing
    return songIds
      .map(id => songMap.get(id))
      .filter((song): song is Song => song !== undefined)
  },

  // For public playlists: fetch songs by IDs without user filter (RLS allows public/trending/own)
  async getSongsByIdsForPublicPlaylist(songIds: string[]): Promise<Song[]> {
    if (songIds.length === 0) return []

    const songMap = new Map<string, Song>()

    for (let i = 0; i < songIds.length; i += PUBLIC_PLAYLIST_ID_CHUNK_SIZE) {
      const chunk = songIds.slice(i, i + PUBLIC_PLAYLIST_ID_CHUNK_SIZE)
      const { data, error } = await (client.from('songs') as any)
        .select(PUBLIC_PLAYLIST_LIST_COLUMNS)
        .in('id', chunk)

      if (error) throw error

      for (const dbSong of data || []) {
        const mappedSong = mapDbSongToList(dbSong)
        songMap.set(dbSong.id, {
          ...mappedSong,
          key: dbSong.key || undefined,
        })
      }
    }

    return songIds
      .map((id) => songMap.get(id))
      .filter((song): song is Song => song !== undefined)
  },

  // Lightweight method for getting minimal song info (for navigation, lists, etc.)
  async getSongInfo(id: string): Promise<Pick<Song, 'id' | 'title' | 'author' | 'songImageUrl' | 'artistImageUrl' | 'userId'> | null> {
    const { data, error } = await (client
      .from('songs') as any)
      .select('id, title, author, song_image_url, artist_image_url, user_id')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching song info:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      author: data.author || '',
      songImageUrl: data.song_image_url || undefined,
      artistImageUrl: data.artist_image_url || undefined,
      userId: data.user_id || undefined,
    }
  },

  async getDistinctCatalogAuthors(limit: number = 200): Promise<string[]> {
    const { data, error } = await (client.from('songs') as any)
      .select('author')
      .or('is_public.eq.true,user_id.is.null')
      .order('author', { ascending: true })
      .limit(2000)

    if (error) throw error

    const seen = new Set<string>()
    const authors: string[] = []
    for (const row of data || []) {
      const author = (row.author as string | null)?.trim()
      if (!author) continue
      const key = author.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      authors.push(author)
      if (authors.length >= limit) break
    }
    return authors
  },

  async listAdminCatalogSongs(options: {
    author?: string
    playlistId?: string
    q?: string
    page: number
    limit: number
  }): Promise<{ songs: Song[]; total: number }> {
    const { author, playlistId, q, page, limit } = options

    if (playlistId) {
      const { data: playlistRow, error: playlistError } = await (client.from('playlists') as any)
        .select('song_ids')
        .eq('id', playlistId)
        .eq('is_public', true)
        .single()

      if (playlistError || !playlistRow) {
        return { songs: [], total: 0 }
      }

      const orderedIds = (playlistRow.song_ids as string[] | null) || []
      if (orderedIds.length === 0) {
        return { songs: [], total: 0 }
      }

      let songs = await this.getSongsByIdsForPublicPlaylist(orderedIds)

      if (author?.trim()) {
        const needle = author.trim().toLowerCase()
        songs = songs.filter((s) => s.author.toLowerCase().includes(needle))
      }
      if (q?.trim()) {
        const needle = q.trim().toLowerCase()
        songs = songs.filter(
          (s) =>
            s.title.toLowerCase().includes(needle) ||
            s.author.toLowerCase().includes(needle)
        )
      }

      const total = songs.length
      const start = (page - 1) * limit
      return { songs: songs.slice(start, start + limit), total }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let builder = (client.from('songs') as any)
      .select(LIGHTWEIGHT_LIST_COLUMNS, { count: 'exact' })
      .or('is_public.eq.true,user_id.is.null')

    if (author?.trim()) {
      builder = builder.ilike('author', `%${author.trim()}%`)
    }
    if (q?.trim()) {
      const term = q.trim()
      builder = builder.or(`title.ilike.%${term}%,author.ilike.%${term}%`)
    }

    builder = builder.order('title', { ascending: true }).range(from, to)

    const { data, error, count } = await builder
    if (error) throw error

    return {
      songs: (data || []).map(mapDbSongToList),
      total: count ?? 0,
    }
  },

  async getSongsByUserIdForAdmin(
    userId: string,
    options: { author?: string; q?: string; page?: number; limit?: number } = {}
  ): Promise<{ songs: Song[]; total: number }> {
    const page = options.page ?? 1
    const limit = options.limit ?? 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    let builder = (client.from('songs') as any)
      .select(LIGHTWEIGHT_LIST_COLUMNS, { count: 'exact' })
      .eq('user_id', userId)

    if (options.author?.trim()) {
      builder = builder.ilike('author', `%${options.author.trim()}%`)
    }
    if (options.q?.trim()) {
      const term = options.q.trim()
      builder = builder.or(`title.ilike.%${term}%,author.ilike.%${term}%`)
    }

    builder = builder.order('updated_at', { ascending: false }).range(from, to)

    const { data, error, count } = await builder
    if (error) throw error

    return {
      songs: (data || []).map(mapDbSongToList),
      total: count ?? 0,
    }
  },
})
