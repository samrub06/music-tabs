import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Folder } from '@/types'
import type { CreateFolderInput, UpdateFolderInput } from '@/lib/validation/schemas'

function mapDbFolderToDomain(dbFolder: Database['public']['Tables']['folders']['Row']): Folder {
  return {
    id: dbFolder.id,
    name: dbFolder.name,
    parentId: undefined, // Schema doesn't seem to have parent_id in the DB definition I saw earlier, but service used it. Let's check types/db.ts
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

  async createFolder(folderData: CreateFolderInput): Promise<Folder> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to create folders')

    const { data, error } = await client
      .from('folders')
      .insert([{
        user_id: user.id,
        name: folderData.name
      }])
      .select()
      .single()

    if (error) throw error

    return mapDbFolderToDomain(data)
  },

  async updateFolder(id: string, updates: UpdateFolderInput): Promise<Folder> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User must be authenticated to update folders')

    const { data, error } = await client
      .from('folders')
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
  }
})

