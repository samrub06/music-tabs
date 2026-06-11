import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Folder } from '@/types'
import type { CreateFolderInput, UpdateFolderInput } from '@/lib/validation/schemas'

function mapDbFolderToDomain(dbFolder: Database['public']['Tables']['folders']['Row']): Folder {
  return {
    id: dbFolder.id,
    name: dbFolder.name,
    parentId: undefined, // Schema doesn't seem to have parent_id in the DB definition I saw earlier, but service used it. Let's check types/db.ts
    displayOrder: dbFolder.display_order ?? undefined,
    createdAt: new Date(dbFolder.created_at),
    updatedAt: new Date(dbFolder.updated_at)
  }
}

export const folderRepo = (client: SupabaseClient<Database>) => ({
  async getAllFolders(): Promise<Folder[]> {
    const { data: { user } } = await client.auth.getUser()
    
    let query = client
      .from('folders')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
       // If no user, RLS usually returns empty, but logic here seems to imply filtering by user_id explicitly
       // If no user, we probably shouldn't return anything or just let RLS handle it.
       // For safety consistent with service:
       return []
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map(mapDbFolderToDomain)
  },

  async getFolderById(folderId: string, userId?: string): Promise<Folder | null> {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return null
      resolvedUserId = user.id
    }

    const { data, error } = await client
      .from('folders')
      .select('id, name, display_order, created_at, updated_at')
      .eq('id', folderId)
      .eq('user_id', resolvedUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No folder found
        return null
      }
      throw error
    }

    return data ? mapDbFolderToDomain(data) : null
  },

  async createFolder(folderData: CreateFolderInput): Promise<Folder> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to create folders')

    // Get the maximum display_order for this user to set the new folder's order
    const { data: existingFolders }: { data: { display_order: number | null }[] | null } = await client
      .from('folders')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false, nullsFirst: false })
      .limit(1)

    const maxOrder = existingFolders?.[0]?.display_order
    const newOrder = maxOrder !== undefined && maxOrder !== null ? maxOrder + 1.0 : 1.0

    const { data, error } = await (client
      .from('folders') as any)
      .insert([{
        user_id: user.id,
        name: folderData.name,
        display_order: newOrder
      }])
      .select()
      .single()

    if (error) throw error

    return mapDbFolderToDomain(data)
  },

  async updateFolder(id: string, updates: UpdateFolderInput): Promise<Folder> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update folders')

    const { data, error } = await (client
      .from('folders') as any)
      .update({
        name: updates.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return mapDbFolderToDomain(data)
  },

  async deleteFolder(id: string): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to delete folders')

    const { error } = await client.from('folders').delete().eq('id', id)
    if (error) throw error
  },

  async updateFolderOrder(folderId: string, newOrder: number): Promise<Folder> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update folder order')

    const { data, error } = await (client
      .from('folders') as any)
      .update({
        display_order: newOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .select()
      .single()

    if (error) throw error

    return mapDbFolderToDomain(data)
  },

  async getSongCountsByFolderLegacy(userId: string): Promise<Map<string, number>> {
    const { data, error } = await client
      .from('songs')
      .select('folder_id')
      .eq('user_id', userId)

    if (error) throw error

    const counts = new Map<string, number>()
    ;((data as Array<{ folder_id: string | null }>) || []).forEach((song) => {
      const folderId = song.folder_id || 'null'
      counts.set(folderId, (counts.get(folderId) || 0) + 1)
    })

    return counts
  },

  // Aggregate counts in DB (get_folder_song_counts RPC) — falls back to legacy scan.
  async getSongCountsByFolder(userId?: string): Promise<Map<string, number>> {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return new Map()
      resolvedUserId = user.id
    }

    const { data, error } = await (client as any).rpc('get_folder_song_counts')

    if (error) {
      return this.getSongCountsByFolderLegacy(resolvedUserId)
    }

    const counts = new Map<string, number>()
    for (const row of (data as Array<{ folder_key: string; song_count: number }>) || []) {
      counts.set(row.folder_key, Number(row.song_count))
    }
    return counts
  },

  // Lightweight version: only load id, name, and display_order for list views
  async getAllFoldersLightweight(userId?: string): Promise<Array<{ id: string; name: string; displayOrder?: number; createdAt: Date }>> {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return []
      resolvedUserId = user.id
    }

    const { data, error } = await client
      .from('folders')
      .select('id, name, display_order, created_at')
      .eq('user_id', resolvedUserId)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data as Array<{ id: string; name: string; display_order: number | null; created_at: string }>) || []).map(f => ({
      id: f.id,
      name: f.name,
      displayOrder: f.display_order ?? undefined,
      createdAt: new Date(f.created_at),
    }))
  }
})

 