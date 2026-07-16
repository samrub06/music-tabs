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
  onboardingCompletedAt: Date | null
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
    onboardingCompletedAt: dbProfile.onboarding_completed_at
      ? new Date(dbProfile.onboarding_completed_at)
      : null,
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
      .select('id, email, full_name, avatar_url, preferred_instrument, spotify_id, tsniout_filter_enabled, onboarding_completed_at, created_at, updated_at')
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
  },

  async listProfilesForAdmin(options: {
    search?: string
    page: number
    limit: number
  }): Promise<{
    profiles: Array<Profile & { songCount: number; lastActivityDate: Date | null }>
    total: number
  }> {
    const { search, page, limit } = options
    const from = (page - 1) * limit
    const to = from + limit - 1

    let builder = (client.from('profiles') as any)
      .select('id, email, full_name, avatar_url, preferred_instrument, spotify_id, tsniout_filter_enabled, created_at, updated_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      builder = builder.or(`email.ilike.${term},full_name.ilike.${term}`)
    }

    const { data, error, count } = await builder
    if (error) throw error

    const rows = (data || []) as Database['public']['Tables']['profiles']['Row'][]
    const userIds = rows.map((r) => r.id)

    const songCounts = new Map<string, number>()
    const lastActivityByUser = new Map<string, Date | null>()
    if (userIds.length > 0) {
      const [{ data: songsData, error: songsError }, { data: statsData, error: statsError }] =
        await Promise.all([
          (client.from('songs') as any).select('user_id').in('user_id', userIds),
          (client.from('user_stats') as any)
            .select('user_id, last_activity_date')
            .in('user_id', userIds),
        ])

      if (songsError) throw songsError
      if (statsError) throw statsError

      for (const row of songsData || []) {
        const uid = row.user_id as string
        songCounts.set(uid, (songCounts.get(uid) ?? 0) + 1)
      }

      for (const row of (statsData || []) as Array<{
        user_id: string
        last_activity_date: string | null
      }>) {
        lastActivityByUser.set(
          row.user_id,
          row.last_activity_date ? new Date(`${row.last_activity_date}T12:00:00`) : null
        )
      }
    }

    return {
      profiles: rows.map((row) => ({
        ...mapDbProfileToDomain(row),
        songCount: songCounts.get(row.id) ?? 0,
        lastActivityDate: lastActivityByUser.get(row.id) ?? null,
      })),
      total: count ?? 0,
    }
  },

  async completeOnboarding(userId: string, preferredInstrument?: 'piano' | 'guitar' | null): Promise<Profile> {
    const updateData: Database['public']['Tables']['profiles']['Update'] = {
      onboarding_completed_at: new Date().toISOString(),
    }

    if (preferredInstrument) {
      updateData.preferred_instrument = preferredInstrument
    }

    const { data, error } = await (client.from('profiles') as any)
      .update(updateData)
      .eq('id', userId)
      .select('id, email, full_name, avatar_url, preferred_instrument, spotify_id, tsniout_filter_enabled, onboarding_completed_at, created_at, updated_at')
      .single()

    if (error) throw error
    return mapDbProfileToDomain(data)
  },

  async linkSpotifyAccount(
    userId: string,
    spotifyId: string,
    refreshToken: string
  ): Promise<Profile> {
    const { data, error } = await (client.from('profiles') as any)
      .update({ spotify_id: spotifyId, spotify_refresh_token: refreshToken })
      .eq('id', userId)
      .select('id, email, full_name, avatar_url, preferred_instrument, spotify_id, tsniout_filter_enabled, onboarding_completed_at, created_at, updated_at')
      .single()

    if (error) throw error
    return mapDbProfileToDomain(data)
  },

  async getSpotifyRefreshToken(userId: string): Promise<string | null> {
    const { data, error } = await (client.from('profiles') as any)
      .select('spotify_refresh_token')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return (data as { spotify_refresh_token?: string | null } | null)?.spotify_refresh_token ?? null
  },

  async updateSpotifyRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const { error } = await (client.from('profiles') as any)
      .update({ spotify_refresh_token: refreshToken })
      .eq('id', userId)

    if (error) throw error
  },

  async unlinkSpotifyAccount(userId: string): Promise<Profile> {
    const { data, error } = await (client.from('profiles') as any)
      .update({ spotify_id: null, spotify_refresh_token: null })
      .eq('id', userId)
      .select('id, email, full_name, avatar_url, preferred_instrument, spotify_id, tsniout_filter_enabled, onboarding_completed_at, created_at, updated_at')
      .single()

    if (error) throw error
    return mapDbProfileToDomain(data)
  },

  async needsOnboarding(userId: string): Promise<boolean> {
    const { data, error } = await (client.from('profiles') as any)
      .select('onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return !(data as { onboarding_completed_at?: string | null } | null)?.onboarding_completed_at
  },
})
