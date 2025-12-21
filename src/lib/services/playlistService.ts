import type { PlaylistResult } from '@/lib/services/playlistGeneratorService';
import type { Playlist, Song } from '@/types';
import { songRepo } from '@/lib/services/songRepo';
import { playlistRepo } from '@/lib/services/playlistRepo';
import { renderStructuredSong } from '@/utils/structuredSong';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';

export const playlistService = {
  async getAllPlaylists(clientSupabase: SupabaseClient<Database>): Promise<Playlist[]> {
    return playlistRepo(clientSupabase).getAllPlaylists();
  },

  async getPlaylist(playlistId: string, clientSupabase: SupabaseClient<Database>): Promise<Playlist> {
    return playlistRepo(clientSupabase).getPlaylist(playlistId);
  },

  async createPlaylist(name: string, description: string | undefined, songIds: string[] = [], clientSupabase: SupabaseClient<Database>): Promise<Playlist> {
    return playlistRepo(clientSupabase).createPlaylist({ name, description, songIds });
  },

  async setPlaylistSongs(playlistId: string, songIds: string[], clientSupabase: SupabaseClient<Database>): Promise<Playlist> {
    return playlistRepo(clientSupabase).updatePlaylist(playlistId, { songIds });
  },

  async createPlaylistFromGeneratedPlaylist(
    name: string,
    playlist: PlaylistResult,
    description: string | undefined,
    clientSupabase: SupabaseClient<Database>
  ): Promise<Playlist> {
    const isUuid = (value?: string) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    let ids: string[] = playlist.songs
      .map((s: Song) => s.id)
      .filter((id: string) => isUuid(id));

    // If some songs do not have UUID ids (e.g., sample data), try to resolve by title+author
    if (ids.length < playlist.songs.length) {
      try {
        const allSongs = await songRepo(clientSupabase).getAllSongs();
        const byKey = new Map<string, string>();
        for (const s of allSongs) {
          const key = `${(s.title || '').trim().toLowerCase()}__${(s.author || '').trim().toLowerCase()}`;
          if (isUuid(s.id)) byKey.set(key, s.id);
        }
        for (const m of playlist.songs as Song[]) {
          const key = `${(m.title || '').trim().toLowerCase()}__${(m.author || '').trim().toLowerCase()}`;
          const found = byKey.get(key);
          if (found && !ids.includes(found)) ids.push(found);
        }
      } catch (e) {
        console.warn('Failed to resolve playlist songs to existing DB songs:', e);
      }
    }

    // As a last resort, create missing songs in DB so we can reference them
    if (ids.length < playlist.songs.length) {
      const existingIdSet = new Set(ids);
      for (const m of playlist.songs as Song[]) {
        if (isUuid(m.id) || existingIdSet.has(m.id)) continue;
        try {
          const content = renderStructuredSong(m as any, { maxWidth: 80, wordWrap: true, isMobile: false });
          const created = await songRepo(clientSupabase).createSong({
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
    const savedPlaylist = await playlistRepo(clientSupabase).createPlaylist({ name, description, songIds: uniqueIds });
    return savedPlaylist;
  }
};
