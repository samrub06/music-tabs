import type { Folder, NewSongData, Song, SongEditData } from '@/types';
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

    return data?.map(song => ({
      ...song,
      createdAt: new Date(song.created_at),
      updatedAt: new Date(song.updated_at)
    })) || [];
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Créer une nouvelle chanson
  async createSong(songData: NewSongData): Promise<Song> {
    const { data, error } = await supabase
      .from('songs')
      .insert([{
        title: songData.title,
        author: songData.author,
        content: songData.content,
        folder_id: songData.folderId,
        format: 'structured',
        sections: [] // Sera rempli par le parser
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating song:', error);
      throw error;
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Mettre à jour une chanson
  async updateSong(id: string, updates: SongEditData): Promise<Song> {
    const { data, error } = await supabase
      .from('songs')
      .update({
        title: updates.title,
        author: updates.author,
        content: updates.content,
        folder_id: updates.folderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song:', error);
      throw error;
    }

    return {
      ...data,
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
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching songs:', error);
      throw error;
    }

    return data?.map(song => ({
      ...song,
      createdAt: new Date(song.created_at),
      updatedAt: new Date(song.updated_at)
    })) || [];
  }
};

// Service pour les dossiers
export const folderService = {
  // Récupérer tous les dossiers
  async getAllFolders(): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return data?.map(folder => ({
      ...folder,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    })) || [];
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
