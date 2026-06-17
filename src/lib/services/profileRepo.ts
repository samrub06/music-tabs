import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export type PreferredInstrument = 'piano' | 'guitar'

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  preferredInstrument: PreferredInstrument | null
  spotifyId: string | null
  tsnioutFilterEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UpdateProfileData {
  fullName?: string | null
  avatarUrl?: string | null
  preferredInstrument?: PreferredInstrument | null
  tsnioutFilterEnabled?: boolean
}

// Helper to map DB result to Domain Entity
function mapDbProfileToDomain(dbProfile: Database['public']['Tables']['profiles']['Row']): Profile {
  const preferredInstrument =
    dbProfile.preferred_instrument === 'piano' || dbProfile.preferred_instrument === 'guitar'
      ? dbProfile.preferred_instrument
      : null
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    avatarUrl: dbProfile.avatar_url,
    preferredInstrument,
    spotifyId: dbProfile.spotify_id ?? null,
    tsnioutFilterEnabled: dbProfile.tsniout_filter_enabled ?? false,
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at)
  }
}

export const profileRepo = (client: SupabaseClient<Database>) => ({
  /**
   * Get current user's profile
   */
  async getPreferredInstrument(userId: string): Promise<PreferredInstrument | null> {
    const { data, error } = await (client.from('profiles') as any)
      .select('preferred_instrument')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    const value = (data as { preferred_instrument?: string | null } | null)?.preferred_instrument
    return value === 'piano' || value === 'guitar' ? value : null
  },

  async getSpotifyId(userId: string): Promise<string | null> {
    const { data, error } = await (client.from('profiles') as any)
      .select('spotify_id')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return (data as { spotify_id?: string | null } | null)?.spotify_id ?? null
  },

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await (client.from('profiles') as any)
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return Boolean((data as { is_admin?: boolean | null } | null)?.is_admin)
  },

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
    const updateData: Database['public']['Tables']['profiles']['Update'] = {}

    if (updates.fullName !== undefined) updateData.full_name = updates.fullName
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
    if (updates.preferredInstrument !== undefined) {
      updateData.preferred_instrument = updates.preferredInstrument
    }
    if (updates.tsnioutFilterEnabled !== undefined) {
      updateData.tsniout_filter_enabled = updates.tsnioutFilterEnabled
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
