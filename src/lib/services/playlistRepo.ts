import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Playlist } from '@/types'
import type { CreatePlaylistInput } from '@/lib/validation/schemas'

function mapDbPlaylistToDomain(dbPlaylist: Database['public']['Tables']['playlists']['Row'] & { image_url?: string | null; is_public?: boolean }): Playlist {
  return {
    id: dbPlaylist.id,
    name: dbPlaylist.name,
    description: dbPlaylist.description || undefined,
    createdAt: new Date(dbPlaylist.created_at),
    updatedAt: new Date(dbPlaylist.updated_at),
    songIds: dbPlaylist.song_ids || [],
    imageUrl: dbPlaylist.image_url || undefined,
    isPublic: dbPlaylist.is_public
  }
}

export const playlistRepo = (client: SupabaseClient<Database>) => ({
  async getAllPlaylists(): Promise<Playlist[]> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) return []

    const { data, error } = await client
      .from('playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(mapDbPlaylistToDomain)
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to view playlists')

    const { data, error } = await client
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return mapDbPlaylistToDomain(data)
  },

  async createPlaylist(data: CreatePlaylistInput & { description?: string, songIds?: string[] }): Promise<Playlist> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to create playlists')

    const { data: result, error } = await (client
      .from('playlists') as any)
      .insert([{
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        song_ids: data.songIds || []
      }])
      .select()
      .single()

    if (error) throw error

    return mapDbPlaylistToDomain(result)
  },

  async updatePlaylist(id: string, updates: Partial<CreatePlaylistInput> & { description?: string, songIds?: string[] }): Promise<Playlist> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update playlists')

    const updateData: Database['public']['Tables']['playlists']['Update'] = {
      updated_at: new Date().toISOString()
    }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.songIds !== undefined) updateData.song_ids = updates.songIds

    const { data, error } = await (client
      .from('playlists') as any)
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return mapDbPlaylistToDomain(data)
  },

  async deletePlaylist(id: string): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to delete playlists')

    const { error } = await client.from('playlists').delete().eq('id', id)
    if (error) throw error
  },

  // Lightweight version: only load id, name, songCount, and createdAt for list views
  async getAllPlaylistsLightweight(): Promise<Array<{ id: string; name: string; songCount: number; createdAt: Date }>> {
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) return []

    const { data, error } = await client
      .from('playlists')
      .select('id, name, song_ids, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data || []) as Array<{ id: string; name: string; song_ids: string[] | null; created_at: string }>).map(p => ({
      id: p.id,
      name: p.name,
      songCount: (p.song_ids as string[] || []).length,
      createdAt: new Date(p.created_at)
    }))
  },

  // Public playlists for Library (no auth required, RLS filters)
  async getPublicPlaylistsLightweight(): Promise<Array<{ id: string; name: string; imageUrl?: string; songCount: number; createdAt: Date }>> {
    const { data, error } = await client
      .from('playlists')
      .select('id, name, image_url, song_ids, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data || []) as Array<{ id: string; name: string; image_url: string | null; song_ids: string[] | null; created_at: string }>).map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.image_url || undefined,
      songCount: (p.song_ids as string[] || []).length,
      createdAt: new Date(p.created_at)
    }))
  },

  async getPublicPlaylist(id: string): Promise<Playlist> {
    const { data, error } = await client
      .from('playlists')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error || !data) throw new Error('Playlist not found')

    return mapDbPlaylistToDomain(data as Database['public']['Tables']['playlists']['Row'] & { image_url?: string | null; is_public?: boolean })
  }
})

