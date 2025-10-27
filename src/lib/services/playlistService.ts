import { supabase } from '@/lib/supabase';
import type { MedleyResult } from '@/lib/services/medleyService';
import type { Playlist, PlaylistItemSnapshot, Song } from '@/types';

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
      updatedAt: new Date(p.updated_at)
    }));
  },

  async getPlaylistWithItems(playlistId: string): Promise<Playlist> {
    const { data: playlist, error: pErr } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();
    if (pErr) throw pErr;

    const { data: items, error: iErr } = await supabase
      .from('playlist_items')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('order_index');
    if (iErr) throw iErr;

    const mappedItems: PlaylistItemSnapshot[] = (items || []).map(it => ({
      id: it.id,
      playlistId: it.playlist_id,
      orderIndex: it.order_index,
      originalSongId: it.original_song_id || undefined,
      title: it.title,
      author: it.author || undefined,
      sections: it.sections,
      key: it.key || undefined,
      capo: it.capo || undefined,
      firstChord: it.first_chord || undefined,
      lastChord: it.last_chord || undefined,
      songImageUrl: it.song_image_url || undefined,
      createdAt: new Date(it.created_at),
      updatedAt: new Date(it.updated_at)
    }));

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || undefined,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at),
      items: mappedItems
    };
  },

  async createPlaylist(name: string, description?: string): Promise<Playlist> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to create playlists');
    const { data, error } = await supabase
      .from('playlists')
      .insert([{ name, description: description || null, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async addItems(
    playlistId: string,
    songs: Song[]
  ): Promise<PlaylistItemSnapshot[]> {
    const isUuid = (value?: string) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    const rows = songs.map((song, index) => ({
      playlist_id: playlistId,
      original_song_id: isUuid(song.id) ? song.id : null,
      order_index: index,
      title: song.title,
      author: song.author,
      sections: song.sections,
      key: song.key || null,
      capo: song.capo || null,
      first_chord: song.firstChord || null,
      last_chord: song.lastChord || null,
      song_image_url: song.songImageUrl || null
    }));
    const { data, error } = await supabase
      .from('playlist_items')
      .insert(rows)
      .select();
    if (error) throw error;
    return (data || []).map(it => ({
      id: it.id,
      playlistId: it.playlist_id,
      orderIndex: it.order_index,
      originalSongId: it.original_song_id || undefined,
      title: it.title,
      author: it.author || undefined,
      sections: it.sections,
      key: it.key || undefined,
      capo: it.capo || undefined,
      firstChord: it.first_chord || undefined,
      lastChord: it.last_chord || undefined,
      songImageUrl: it.song_image_url || undefined,
      createdAt: new Date(it.created_at),
      updatedAt: new Date(it.updated_at)
    }));
  },

  async createPlaylistFromMedley(
    name: string,
    medley: MedleyResult,
    description?: string
  ): Promise<Playlist> {
    const playlist = await this.createPlaylist(name, description);
    await this.addItems(playlist.id, medley.songs);
    return await this.getPlaylistWithItems(playlist.id);
  }
};


