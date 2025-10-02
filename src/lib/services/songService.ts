import type { Folder, NewSongData, Song, SongEditData } from '@/types';
import { parseTextToStructuredSong } from '@/utils/songParser';
import { supabase } from '../supabase';

// Service pour les chansons
export const songService = {
  // Récupérer toutes les chansons
  async getAllSongs(): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

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
  async createSong(songData: NewSongData): Promise<Song> {
    // Parser le contenu texte en structure structurée
    const structuredSong = parseTextToStructuredSong(
      songData.title,
      songData.author,
      songData.content,
      songData.folderId
    );

    const { data, error } = await supabase
      .from('songs')
      .insert([{
        title: songData.title,
        author: songData.author,
        folder_id: songData.folderId,
        format: 'structured',
        sections: structuredSong.sections
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

  // Supprimer une chanson
  async deleteSong(id: string): Promise<void> {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  },

  // Rechercher des chansons
  async searchSongs(query: string): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching songs:', error);
      throw error;
    }

    return data?.map(song => ({
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
  async getAllFolders(): Promise<Folder[]> {
    console.log('Fetching folders from database...');
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });

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
  async createFolder(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const { data, error } = await supabase
      .from('folders')
      .insert([{
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
