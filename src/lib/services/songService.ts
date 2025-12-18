import type { Folder, NewSongData, Song, SongEditData } from '@/types';
import { parseTextToStructuredSong } from '@/utils/songParser';

// Service pour les chansons
export const songService = {
  // Récupérer toutes les chansons (sans contenu) avec pagination
  // Si connecté : uniquement les chansons de l'utilisateur
  // Si non connecté : uniquement les chansons publiques (user_id = null)
  async getAllSongs(clientSupabase?: any, page: number = 1, limit: number = 100, q?: string): Promise<{ songs: Song[], total: number }> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    const { data: { user } } = await client.auth.getUser();
    
    let baseQuery = client
      .from('songs')
      .select('id, title, author, folder_id, created_at, updated_at, rating, difficulty, artist_image_url, song_image_url, view_count, version, version_description, key, first_chord, last_chord, tab_id, genre, bpm', { count: 'exact' });
    
    // Si non connecté, récupérer uniquement les chansons publiques (sans user_id)
    if (!user) {
      baseQuery = baseQuery.is('user_id', null);
    } else {
      // Si connecté, récupérer uniquement les chansons de l'utilisateur
      baseQuery = baseQuery.eq('user_id', user.id);
    }

    if (q && q.trim()) {
      const query = q.trim()
      baseQuery = baseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    }

    const { data, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }

    const mappedSongs: Song[] = (data as any[])?.map((song: any) => ({
      ...song,
      folderId: song.folder_id, // Map folder_id to folderId
      createdAt: new Date(song.created_at),
      updatedAt: new Date(song.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: song.version,
      versionDescription: song.version_description,
      rating: song.rating,
      difficulty: song.difficulty,
      artistImageUrl: song.artist_image_url,
      songImageUrl: song.song_image_url,
      viewCount: song.view_count || 0,
      key: song.key,
      firstChord: song.first_chord,
      lastChord: song.last_chord,
      tabId: song.tab_id,
      genre: song.genre,
      bpm: song.bpm
    })) || [];
    
    return { songs: mappedSongs, total: count || 0 };
  },

  // Récupérer une chanson par ID
  async getSongById(id: string, clientSupabase?: any): Promise<Song | null> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    const { data, error } = await client
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching song:', error);
      return null;
    }

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: data.version,
      versionDescription: data.version_description,
      rating: data.rating,
      difficulty: data.difficulty,
      artistUrl: data.artist_url,
      artistImageUrl: data.artist_image_url,
      songImageUrl: data.song_image_url,
      sourceUrl: data.source_url,
      sourceSite: data.source_site,
      tabId: data.tab_id,
      genre: data.genre,
      bpm: data.bpm
    };
  },

  // Créer une nouvelle chanson
  async createSong(songData: NewSongData, clientSupabase?: any): Promise<Song> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    
    // Récupérer l'utilisateur (peut être null si non connecté)
    const { data: { user } } = await client.auth.getUser();

    // Parser le contenu texte en structure structurée
    const structuredSong = parseTextToStructuredSong(
      songData.title,
      songData.author,
      songData.content,
      songData.folderId,
      songData.reviews,
      songData.capo,
      songData.key
    );

    const { data, error } = await client
      .from('songs')
      .insert([{
        user_id: user?.id || null, // user_id si connecté, null si public
        title: songData.title,
        author: songData.author,
        folder_id: songData.folderId,
        format: 'structured',
        sections: structuredSong.sections,
        reviews: songData.reviews || 0,
        capo: songData.capo || null,
        key: songData.key || structuredSong.firstChord,
        first_chord: structuredSong.firstChord || null,
        last_chord: structuredSong.lastChord || null,
        version: songData.version || null,
        version_description: songData.versionDescription || null,
        rating: songData.rating || null,
        difficulty: songData.difficulty || null,
        artist_url: songData.artistUrl || null,
        artist_image_url: songData.artistImageUrl || null,
        song_image_url: songData.songImageUrl || null,
        source_url: songData.sourceUrl || null,
        source_site: songData.sourceSite || null,
        tab_id: songData.tabId || null,
        genre: songData.genre || null,
        bpm: songData.bpm || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating song:', error);
      throw error;
    }

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: data.version,
      versionDescription: data.version_description,
      rating: data.rating,
      difficulty: data.difficulty,
      artistUrl: data.artist_url,
      artistImageUrl: data.artist_image_url,
      songImageUrl: data.song_image_url,
      sourceUrl: data.source_url,
      sourceSite: data.source_site,
      tabId: data.tab_id,
      genre: data.genre,
      bpm: data.bpm
    };
  },

  // Mettre à jour une chanson
  async updateSong(id: string, updates: SongEditData, clientSupabase?: any): Promise<Song> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update songs');
    }
    
    // Parser le nouveau contenu si fourni
    let sections = undefined;
    if (updates.content) {
      const structuredSong = parseTextToStructuredSong(
        updates.title,
        updates.author,
        updates.content,
        updates.folderId
      );
      sections = structuredSong.sections;
    }

    const updateData: any = {
      title: updates.title,
      author: updates.author,
      folder_id: updates.folderId,
      updated_at: new Date().toISOString(),
      // Nouveaux champs Ultimate Guitar
      version: updates.version || null,
      version_description: updates.versionDescription || null,
      rating: updates.rating || null,
      difficulty: updates.difficulty || null,
      artist_url: updates.artistUrl || null,
      artist_image_url: updates.artistImageUrl || null,
      song_image_url: updates.songImageUrl || null,
      source_url: updates.sourceUrl || null,
      source_site: updates.sourceSite || null,
      tab_id: updates.tabId || null,
      genre: updates.genre || null,
      bpm: updates.bpm || null
    };

    if (sections) {
      updateData.sections = sections;
    }

    const { data, error } = await client
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song:', error);
      throw error;
    }

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: data.version,
      versionDescription: data.version_description,
      rating: data.rating,
      difficulty: data.difficulty,
      artistUrl: data.artist_url,
      artistImageUrl: data.artist_image_url,
      songImageUrl: data.song_image_url,
      sourceUrl: data.source_url,
      sourceSite: data.source_site,
      tabId: data.tab_id,
      genre: data.genre,
      bpm: data.bpm
    };
  },

  // Mettre à jour seulement le dossier d'une chanson
  async updateSongFolder(id: string, folderId: string | undefined, clientSupabase?: any): Promise<Song> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update songs');
    }

    const updateData = {
      folder_id: folderId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song folder:', error);
      throw error;
    }

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: data.version,
      versionDescription: data.version_description,
      rating: data.rating,
      difficulty: data.difficulty,
      artistUrl: data.artist_url,
      artistImageUrl: data.artist_image_url,
      songImageUrl: data.song_image_url,
      sourceUrl: data.source_url,
      sourceSite: data.source_site,
      tabId: data.tab_id,
      genre: data.genre,
      bpm: data.bpm
    };
  },

  // Incrémenter le compteur de vues d'une chanson
  async incrementViewCount(songId: string, clientSupabase?: any): Promise<void> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    const { error } = await client.rpc('increment_view_count', {
      song_id: songId
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  },

  // Supprimer une chanson
  async deleteSong(id: string, clientSupabase?: any): Promise<void> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    const { error } = await client
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  },

  // Supprimer plusieurs chansons
   async deleteSongs(ids: string[], clientSupabase?: any): Promise<void> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    if (ids.length === 0) {
      return;
    }

    const { error } = await client
      .from('songs')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting songs:', error);
      throw error;
    }
  },

  // Supprimer toutes les chansons de l'utilisateur
  async deleteAllSongs(clientSupabase?: any): Promise<void> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    const { error } = await client
      .from('songs')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting all songs:', error);
      throw error;
    }
  },

  // Rechercher des chansons
  async searchSongs(query: string, clientSupabase?: any): Promise<Song[]> {
    const client = clientSupabase;
    if (!client) {
      throw new Error('Supabase client is required');
    }
    const { data, error } = await client
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching songs:', error);
      throw error;
    }

    return data?.map((song: any) => ({
      ...song,
      folderId: song.folder_id, // Map folder_id to folderId
      createdAt: new Date(song.created_at),
      updatedAt: new Date(song.updated_at),
      // Mapper les nouveaux champs Ultimate Guitar
      version: song.version,
      versionDescription: song.version_description,
      rating: song.rating,
      difficulty: song.difficulty,
      artistUrl: song.artist_url,
      artistImageUrl: song.artist_image_url,
      songImageUrl: song.song_image_url,
      sourceUrl: song.source_url,
      sourceSite: song.source_site,
      tabId: song.tab_id,
      genre: song.genre,
      bpm: song.bpm
    })) || [];
  }
};
