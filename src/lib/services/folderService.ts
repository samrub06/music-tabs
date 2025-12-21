import type { Folder } from '@/types'
import { folderRepo } from './folderRepo'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/db'

export const folderService = {
  async getAllFolders(clientSupabase: SupabaseClient<Database>): Promise<Folder[]> {
    return folderRepo(clientSupabase).getAllFolders()
  },

  async createFolder(folderData: { name: string }, clientSupabase: SupabaseClient<Database>): Promise<Folder> {
    return folderRepo(clientSupabase).createFolder(folderData)
  },

  async updateFolder(id: string, updates: { name: string }, clientSupabase: SupabaseClient<Database>): Promise<Folder> {
    return folderRepo(clientSupabase).updateFolder(id, updates)
  },

  async deleteFolder(id: string, clientSupabase: SupabaseClient<Database>): Promise<void> {
    return folderRepo(clientSupabase).deleteFolder(id)
  },

  async updateFolderOrder(folderId: string, newOrder: number, clientSupabase: SupabaseClient<Database>): Promise<Folder> {
    return folderRepo(clientSupabase).updateFolderOrder(folderId, newOrder)
  }
}
