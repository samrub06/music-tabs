import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import { profileRepo } from '@/lib/services/profileRepo'

export async function getIsAdmin(client: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return false
  return profileRepo(client).isAdmin(user.id)
}

export async function assertIsAdmin(client: SupabaseClient<Database>): Promise<User> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated')
  }
  const isAdmin = await profileRepo(client).isAdmin(user.id)
  if (!isAdmin) {
    throw new Error('Forbidden')
  }
  return user
}
