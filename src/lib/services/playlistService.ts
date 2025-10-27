import { supabase } from '@/lib/supabase';
import type { MedleyResult } from '@/lib/services/medleyService';
import type { Playlist, Song } from '@/types';
import { songService } from '@/lib/services/songService';
import { renderStructuredSong } from '@/utils/structuredSong';

export const playlistService = {
  async getAllPlaylists(): Promise<Playlist[]> {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('playlists').select('*').order('created_at', { ascending: false });
    if (!user) {
      // no playlists visible if not logged in
      return [];
    }
    query = query.eq('user_id', user.id);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
      songIds: (p.song_ids as string[]) || []
    }));
  },

  async getPlaylist(playlistId: string): Promise<Playlist> {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();
    if (error) throw error;
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || undefined,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at),
      songIds: (playlist.song_ids as string[]) || []
    };
  },

  async createPlaylist(name: string, description?: string, songIds: string[] = []): Promise<Playlist> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to create playlists');
    const { data, error } = await supabase
      .from('playlists')
      .insert([{ name, description: description || null, user_id: user.id, song_ids: songIds }])
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      songIds: (data.song_ids as string[]) || []
    };
  },

  async setPlaylistSongs(playlistId: string, songIds: string[]): Promise<Playlist> {
    const { data, error } = await supabase
      .from('playlists')
      .update({ song_ids: songIds, updated_at: new Date().toISOString() })
      .eq('id', playlistId)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      songIds: (data.song_ids as string[]) || []
    };
  },

  async createPlaylistFromMedley(
    name: string,
    medley: MedleyResult,
    description?: string
  ): Promise<Playlist> {
    const isUuid = (value?: string) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    let ids: string[] = medley.songs
      .map((s: Song) => s.id)
      .filter((id: string) => isUuid(id));

    // If some songs do not have UUID ids (e.g., sample data), try to resolve by title+author
    if (ids.length < medley.songs.length) {
      try {
        const all = await songService.getAllSongs();
        const byKey = new Map<string, string>();
        for (const s of all) {
          const key = `${(s.title || '').trim().toLowerCase()}__${(s.author || '').trim().toLowerCase()}`;
          if (isUuid(s.id)) byKey.set(key, s.id);
        }
        for (const m of medley.songs as Song[]) {
          const key = `${(m.title || '').trim().toLowerCase()}__${(m.author || '').trim().toLowerCase()}`;
          const found = byKey.get(key);
          if (found && !ids.includes(found)) ids.push(found);
        }
      } catch (e) {
        console.warn('Failed to resolve medley songs to existing DB songs:', e);
      }
    }

    // As a last resort, create missing songs in DB so we can reference them
    if (ids.length < medley.songs.length) {
      const existingIdSet = new Set(ids);
      for (const m of medley.songs as Song[]) {
        if (isUuid(m.id) || existingIdSet.has(m.id)) continue;
        try {
          const content = renderStructuredSong(m as any, { maxWidth: 80, wordWrap: true, isMobile: false });
          const created = await songService.createSong({
            title: m.title,
            author: m.author || '',
            content,
            folderId: m.folderId,
            key: m.key,
            capo: m.capo
          });
          if (isUuid(created.id)) {
            ids.push(created.id);
            existingIdSet.add(created.id);
          }
        } catch (e) {
          console.warn('Failed to create missing song for playlist:', m.title, e);
        }
      }
    }

    const uniqueIds = Array.from(new Set(ids));
    const playlist = await this.createPlaylist(name, description, uniqueIds);
    return playlist;
  }
};


