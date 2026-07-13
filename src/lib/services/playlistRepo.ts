import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Playlist } from '@/types'
import type { CreatePlaylistInput } from '@/lib/validation/schemas'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'

function mapDbPlaylistToDomain(dbPlaylist: Database['public']['Tables']['playlists']['Row'] & { image_url?: string | null; is_public?: boolean; curated_slug?: string | null }): Playlist {
  return {
    id: dbPlaylist.id,
    name: dbPlaylist.name,
    description: dbPlaylist.description || undefined,
    createdAt: new Date(dbPlaylist.created_at),
    updatedAt: new Date(dbPlaylist.updated_at),
    songIds: dbPlaylist.song_ids || [],
    imageUrl: dbPlaylist.image_url || undefined,
    isPublic: dbPlaylist.is_public,
    curatedSlug: dbPlaylist.curated_slug || undefined,
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
      .select('id, name, description, created_at, updated_at, song_ids, image_url, is_public')
      .eq('id', id)
      .single()

    if (error) throw error

    return mapDbPlaylistToDomain(data)
  },

  async createPlaylist(data: CreatePlaylistInput & { description?: string, songIds?: string[], imageUrl?: string }): Promise<Playlist> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to create playlists')

    const { data: result, error } = await (client
      .from('playlists') as any)
      .insert([{
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        song_ids: data.songIds || [],
        image_url: data.imageUrl || null,
      }])
      .select()
      .single()

    if (error) throw error

    return mapDbPlaylistToDomain(result)
  },

  async updatePlaylist(id: string, updates: Partial<CreatePlaylistInput> & { description?: string, songIds?: string[], imageUrl?: string }): Promise<Playlist> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update playlists')

    const updateData: Database['public']['Tables']['playlists']['Update'] = {
      updated_at: new Date().toISOString()
    }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.songIds !== undefined) updateData.song_ids = updates.songIds
    if (updates.imageUrl !== undefined) {
      updateData.image_url = updates.imageUrl
    }

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
  async getAllPlaylistsLightweight(userId?: string): Promise<Array<{ id: string; name: string; songCount: number; createdAt: Date; imageUrl?: string }>> {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return []
      resolvedUserId = user.id
    }

    const { data: rpcData, error: rpcError } = await (client as any).rpc('get_playlist_list_lightweight')

    if (!rpcError && rpcData) {
      return (rpcData as Array<{
        id: string
        name: string
        created_at: string
        image_url: string | null
        song_count: number
      }>).map((p) => ({
        id: p.id,
        name: p.name,
        songCount: Number(p.song_count),
        createdAt: new Date(p.created_at),
        imageUrl: p.image_url || undefined,
      }))
    }

    const { data, error } = await client
      .from('playlists')
      .select('id, name, song_ids, created_at, image_url')
      .eq('user_id', resolvedUserId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data || []) as Array<{ id: string; name: string; song_ids: string[] | null; created_at: string; image_url: string | null }>).map(p => ({
      id: p.id,
      name: p.name,
      songCount: (p.song_ids as string[] || []).length,
      createdAt: new Date(p.created_at),
      imageUrl: p.image_url || undefined,
    }))
  },

  async getPublicPlaylistsLightweight(): Promise<Array<{ id: string; name: string; imageUrl?: string; songCount: number; createdAt: Date; curatedSlug?: string; displayOrder: number }>> {
    const { data, error } = await client
      .from('playlists')
      .select('id, name, image_url, song_ids, created_at, curated_slug, display_order')
      .eq('is_public', true)
      .not('curated_slug', 'is', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data || []) as Array<{
      id: string
      name: string
      image_url: string | null
      song_ids: string[] | null
      created_at: string
      curated_slug: string | null
      display_order: number | null
    }>).map(p => ({
      id: p.id,
      name: p.name,
      imageUrl:
        p.image_url ??
        (p.curated_slug ? getCuratedPlaylistCoverUrl(p.curated_slug) : null) ??
        undefined,
      songCount: (p.song_ids as string[] || []).length,
      createdAt: new Date(p.created_at),
      curatedSlug: p.curated_slug || undefined,
      displayOrder: p.display_order ?? 0,
    }))
  },

  async getPublicPlaylist(id: string): Promise<Playlist> {
    const { data, error } = await client
      .from('playlists')
      .select('id, name, description, created_at, updated_at, song_ids, image_url, is_public, curated_slug')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error || !data) throw new Error('Playlist not found')

    return mapDbPlaylistToDomain(data as Database['public']['Tables']['playlists']['Row'] & { image_url?: string | null; is_public?: boolean })
  },

  async getPublicPlaylistsForAdmin(): Promise<Playlist[]> {
    const { data, error } = await client
      .from('playlists')
      .select('id, name, description, created_at, updated_at, song_ids, image_url, is_public, curated_slug')
      .eq('is_public', true)
      .not('curated_slug', 'is', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((row) =>
      mapDbPlaylistToDomain(row as Database['public']['Tables']['playlists']['Row'])
    )
  },

  async updatePublicPlaylist(
    id: string,
    updates: { songIds?: string[]; name?: string; description?: string }
  ): Promise<Playlist> {
    const updateData: Database['public']['Tables']['playlists']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.songIds !== undefined) updateData.song_ids = updates.songIds

    const { data, error } = await (client.from('playlists') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbPlaylistToDomain(data)
  },
})

