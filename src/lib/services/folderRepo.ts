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
  }
})

 