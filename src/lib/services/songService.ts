import type { Folder, NewSongData, Song, SongEditData } from '@/types';
import { parseTextToStructuredSong } from '@/utils/songParser';
import { supabase } from '../supabase';

// Service pour les chansons
export const songService = {
  // Récupérer toutes les chansons
  // Si connecté : uniquement les chansons de l'utilisateur
  // Si non connecté : uniquement les chansons publiques (user_id = null)
  async getAllSongs(): Promise<Song[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('user', user);
    let query = supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Si non connecté, récupérer uniquement les chansons publiques (sans user_id)
    if (!user) {
      query = query.is('user_id', null);
    } else {
      // Si connecté, récupérer uniquement les chansons de l'utilisateur
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    console.log('data', error);

    if (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }

    const mappedSongs = data?.map(song => ({
      ...song,
      folderId: song.folder_id, // Map folder_id to folderId
      createdAt: new Date(song.created_at),
      updatedAt: new Date(song.updated_at)
    })) || [];
    
    console.log('Mapped songs with folder IDs:', mappedSongs.map(s => ({ id: s.id, title: s.title, folderId: s.folderId })));
    return mappedSongs;
  },

  // Récupérer une chanson par ID
  async getSongById(id: string): Promise<Song | null> {
    const { data, error } = await supabase
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
      updatedAt: new Date(data.updated_at)
    };
  },

  // Créer une nouvelle chanson
  async createSong(songData: NewSongData, clientSupabase?: any): Promise<Song> {
    // Utiliser le client Supabase fourni ou le client par défaut
    const client = clientSupabase || supabase;
    
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
        key: songData.key || null,
        sounding_key: songData.soundingKey || null,
        first_chord: structuredSong.firstChord || null,
        last_chord: structuredSong.lastChord || null,
        chord_progression: structuredSong.chordProgression || null
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
      updatedAt: new Date(data.updated_at)
    };
  },

  // Mettre à jour une chanson
  async updateSong(id: string, updates: SongEditData): Promise<Song> {
    console.log('songService.updateSong called with:', { id, updates });
    
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update songs');
    }
    
    // Parser le nouveau contenu si fourni
    let sections = undefined;
    if (updates.content) {
      console.log('Parsing content to structured song...');
      const structuredSong = parseTextToStructuredSong(
        updates.title,
        updates.author,
        updates.content,
        updates.folderId
      );
      sections = structuredSong.sections;
      console.log('Parsed sections:', sections);
    }

    const updateData: any = {
      title: updates.title,
      author: updates.author,
      folder_id: updates.folderId,
      updated_at: new Date().toISOString()
    };

    if (sections) {
      updateData.sections = sections;
    }

    console.log('Updating database with:', updateData);

    const { data, error } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song:', error);
      throw error;
    }

    console.log('Song updated successfully:', data);

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Mettre à jour seulement le dossier d'une chanson
  async updateSongFolder(id: string, folderId: string | undefined): Promise<Song> {
    console.log('songService.updateSongFolder called with:', { id, folderId });
    
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update songs');
    }

    const updateData = {
      folder_id: folderId,
      updated_at: new Date().toISOString()
    };

    console.log('Updating song folder with:', updateData);

    const { data, error } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song folder:', error);
      throw error;
    }

    console.log('Song folder updated successfully:', data);

    return {
      ...data,
      folderId: data.folder_id, // Map folder_id to folderId
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Supprimer une chanson
  async deleteSong(id: string): Promise<void> {
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  },

  // Supprimer plusieurs chansons
  async deleteSongs(ids: string[]): Promise<void> {
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    if (ids.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting songs:', error);
      throw error;
    }
  },

  // Supprimer toutes les chansons de l'utilisateur
  async deleteAllSongs(): Promise<void> {
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete songs');
    }

    const { error } = await supabase
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
    const client = clientSupabase || supabase;
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
      updatedAt: new Date(song.updated_at)
    })) || [];
  }
};

// Service pour les dossiers
export const folderService = {
  // Récupérer tous les dossiers
  // Si connecté : uniquement les dossiers de l'utilisateur
  // Si non connecté : uniquement les dossiers publics (user_id = null)
  async getAllFolders(): Promise<Folder[]> {
    console.log('Fetching folders from database...');
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Si non connecté, récupérer uniquement les dossiers publics (sans user_id)
    if (!user) {
      query = query.is('user_id', null);
    } else {
      // Si connecté, récupérer uniquement les dossiers de l'utilisateur
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    console.log('Raw folders data:', data);
    
    const mappedFolders = data?.map(folder => ({
      ...folder,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    })) || [];
    
    console.log('Mapped folders:', mappedFolders);
    return mappedFolders;
  },

  // Créer un nouveau dossier
  async createFolder(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>, clientSupabase?: any): Promise<Folder> {
    // Utiliser le client Supabase fourni ou le client par défaut
    const client = clientSupabase || supabase;
    
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create folders');
    }

    const { data, error } = await client
      .from('folders')
      .insert([{
        user_id: user.id, // Ajouter user_id
        name: folderData.name,
        parent_id: folderData.parentId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      throw error;
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Mettre à jour un dossier
  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update folders');
    }

    const { data, error } = await supabase
      .from('folders')
      .update({
        name: updates.name,
        parent_id: updates.parentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error);
      throw error;
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Supprimer un dossier
  async deleteFolder(id: string): Promise<void> {
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete folders');
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }
};
