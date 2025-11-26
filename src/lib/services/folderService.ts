import type { Folder } from '@/types'
import { supabase } from '../supabase'

export const folderService = {
  async getAllFolders(clientSupabase?: any): Promise<Folder[]> {
    const client = clientSupabase || supabase
    const { data: { user } } = await client.auth.getUser()

    let query = client
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!user) {
      query = query.is('user_id', null)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching folders:', error)
      throw error
    }

    const mappedFolders = data?.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    })) || []

    return mappedFolders
  },

  async createFolder(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>, clientSupabase?: any): Promise<Folder> {
    const client = clientSupabase || supabase
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to create folders')
    }

    const { data, error } = await client
      .from('folders')
      .insert([{
        user_id: user.id,
        name: folderData.name,
        parent_id: (folderData as any).parentId
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      throw error
    }

    return {
      ...data,
      createdAt: new Date((data as any).created_at),
      updatedAt: new Date((data as any).updated_at)
    }
  },

  async updateFolder(id: string, updates: Partial<Folder>, clientSupabase?: any): Promise<Folder> {
    const client = clientSupabase || supabase
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to update folders')
    }

    const { data, error } = await client
      .from('folders')
      .update({
        name: updates.name,
        parent_id: (updates as any).parentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating folder:', error)
      throw error
    }

    return {
      ...data,
      createdAt: new Date((data as any).created_at),
      updatedAt: new Date((data as any).updated_at)
    }
  },

  async deleteFolder(id: string, clientSupabase?: any): Promise<void> {
    const client = clientSupabase || supabase
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete folders')
    }
    const { error } = await client.from('folders').delete().eq('id', id)
    if (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }
}


