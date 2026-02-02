import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateProfileData {
  fullName?: string | null
  avatarUrl?: string | null
}

// Helper to map DB result to Domain Entity
function mapDbProfileToDomain(dbProfile: Database['public']['Tables']['profiles']['Row']): Profile {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    avatarUrl: dbProfile.avatar_url,
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at)
  }
}

export const profileRepo = (client: SupabaseClient<Database>) => ({
  /**
   * Get current user's profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw error
    }

    return data ? mapDbProfileToDomain(data) : null
  },

  /**
   * Update current user's profile
   */
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<Profile> {
    const updateData: Database['public']['Tables']['profiles']['Update'] = {
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl
    }

    const { data, error } = await (client
      .from('profiles') as any)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDbProfileToDomain(data)
  }
})
