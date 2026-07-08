import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type {
  Friendship,
  FriendProfile,
  FriendRelationStatus,
  FriendshipStatus,
} from '@/types'

type FriendshipRow = Database['public']['Tables']['friendships']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

function mapDbFriendshipToDomain(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status as FriendshipStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function getRelationStatus(
  userId: string,
  otherUserId: string,
  friendship: Friendship | null
): FriendRelationStatus {
  if (!friendship) return 'none'
  if (friendship.status === 'accepted') return 'friends'
  if (friendship.status === 'declined') return 'declined'
  if (friendship.requesterId === userId) return 'pending_sent'
  return 'pending_received'
}

async function getFriendshipMapForUsers(
  client: SupabaseClient<Database>,
  userId: string
): Promise<Map<string, Friendship>> {
  const { data, error } = await client
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at, updated_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) throw error

  const friendshipByOtherId = new Map<string, Friendship>()
  for (const row of (data || []) as FriendshipRow[]) {
    const friendship = mapDbFriendshipToDomain(row)
    const otherId =
      friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId
    friendshipByOtherId.set(otherId, friendship)
  }

  return friendshipByOtherId
}

function mapProfilesToFriendProfiles(
  userId: string,
  profiles: Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url'>[],
  friendshipByOtherId: Map<string, Friendship>
): FriendProfile[] {
  return profiles.map((profile) => {
    const friendship = friendshipByOtherId.get(profile.id) ?? null
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      relationStatus: getRelationStatus(userId, profile.id, friendship),
      friendshipId: friendship?.id ?? null,
    }
  })
}

export const friendsRepo = (client: SupabaseClient<Database>) => ({
  async findFriendshipBetween(userId: string, otherUserId: string): Promise<Friendship | null> {
    const { data, error } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`
      )
      .maybeSingle()

    if (error) throw error
    return data ? mapDbFriendshipToDomain(data as FriendshipRow) : null
  },

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    if (requesterId === addresseeId) {
      throw new Error('Cannot send a friend request to yourself')
    }

    const existing = await this.findFriendshipBetween(requesterId, addresseeId)
    if (existing?.status === 'accepted') {
      throw new Error('Already friends')
    }
    if (existing?.status === 'pending') {
      if (existing.requesterId === addresseeId) {
        return this.acceptFriendRequest(existing.id, requesterId)
      }
      throw new Error('Friend request already sent')
    }

    const { data, error } = await (client.from('friendships') as any)
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .single()

    if (error) throw error
    return mapDbFriendshipToDomain(data as FriendshipRow)
  },

  async acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship> {
    const { data: existing, error: fetchError } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .eq('id', friendshipId)
      .single()

    if (fetchError) throw fetchError
    const friendship = mapDbFriendshipToDomain(existing as FriendshipRow)

    if (friendship.addresseeId !== userId && friendship.requesterId !== userId) {
      throw new Error('Not allowed')
    }
    if (friendship.status !== 'pending') {
      throw new Error('Request is no longer pending')
    }

    const { data, error } = await (client.from('friendships') as any)
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .single()

    if (error) throw error
    return mapDbFriendshipToDomain(data as FriendshipRow)
  },

  async declineFriendRequest(friendshipId: string, userId: string): Promise<void> {
    const { data: existing, error: fetchError } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .single()

    if (fetchError) throw fetchError
    const row = existing as FriendshipRow
    if (row.addressee_id !== userId) {
      throw new Error('Not allowed')
    }

    const { error } = await (client.from('friendships') as any)
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)

    if (error) throw error
  },

  async cancelFriendRequest(friendshipId: string, userId: string): Promise<void> {
    const { data: existing, error: fetchError } = await client
      .from('friendships')
      .select('id, requester_id, status')
      .eq('id', friendshipId)
      .single()

    if (fetchError) throw fetchError
    const row = existing as FriendshipRow
    if (row.requester_id !== userId || row.status !== 'pending') {
      throw new Error('Not allowed')
    }

    const { error } = await client
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) throw error
  },

  async removeFriend(friendshipId: string, userId: string): Promise<void> {
    const { data: existing, error: fetchError } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .single()

    if (fetchError) throw fetchError
    const row = existing as FriendshipRow
    if (row.requester_id !== userId && row.addressee_id !== userId) {
      throw new Error('Not allowed')
    }
    if (row.status !== 'accepted') {
      throw new Error('Not friends')
    }

    const { error } = await client
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) throw error
  },

  async getAcceptedFriends(userId: string): Promise<FriendProfile[]> {
    const { data, error } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    if (error) throw error

    const friendships = ((data || []) as FriendshipRow[]).map(mapDbFriendshipToDomain)
    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    )

    if (friendIds.length === 0) return []

    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', friendIds)

    if (profilesError) throw profilesError

    const friendshipByFriendId = new Map<string, Friendship>()
    for (const friendship of friendships) {
      const friendId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId
      friendshipByFriendId.set(friendId, friendship)
    }

    return ((profiles || []) as Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url'>[]).map((profile) => ({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      relationStatus: 'friends' as const,
      friendshipId: friendshipByFriendId.get(profile.id)?.id ?? null,
    }))
  },

  async getPendingReceivedRequests(userId: string): Promise<FriendProfile[]> {
    const { data, error } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .eq('status', 'pending')
      .eq('addressee_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const friendships = ((data || []) as FriendshipRow[]).map(mapDbFriendshipToDomain)
    const requesterIds = friendships.map((f) => f.requesterId)

    if (requesterIds.length === 0) return []

    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', requesterIds)

    if (profilesError) throw profilesError

    const friendshipByRequesterId = new Map<string, Friendship>()
    for (const friendship of friendships) {
      friendshipByRequesterId.set(friendship.requesterId, friendship)
    }

    const profileById = new Map(
      ((profiles || []) as Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url'>[]).map(
        (profile) => [profile.id, profile]
      )
    )

    return requesterIds
      .map((requesterId) => {
        const profile = profileById.get(requesterId)
        if (!profile) return null
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          relationStatus: 'pending_received' as const,
          friendshipId: friendshipByRequesterId.get(profile.id)?.id ?? null,
        }
      })
      .filter((profile): profile is FriendProfile => profile !== null)
  },

  async getDiscoverableUsers(userId: string, limit: number = 20): Promise<FriendProfile[]> {
    const friendshipByOtherId = await getFriendshipMapForUsers(client, userId)
    const friendIds = new Set(
      Array.from(friendshipByOtherId.entries())
        .filter(([, friendship]) => friendship.status === 'accepted')
        .map(([otherId]) => otherId)
    )

    const { data: profiles, error } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .neq('id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + friendIds.size)

    if (error) throw error

    const rows = ((profiles || []) as Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url'>[])
      .filter((profile) => !friendIds.has(profile.id))
      .slice(0, limit)

    return mapProfilesToFriendProfiles(userId, rows, friendshipByOtherId)
  },

  async searchUsers(userId: string, query: string, limit: number = 20): Promise<FriendProfile[]> {
    const term = query.trim()
    if (!term) return []

    const search = `%${term}%`
    const { data: profiles, error } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .neq('id', userId)
      .or(`email.ilike.${search},full_name.ilike.${search}`)
      .limit(limit)

    if (error) throw error

    const rows = (profiles || []) as Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url'>[]
    const friendshipByOtherId = await getFriendshipMapForUsers(client, userId)

    return mapProfilesToFriendProfiles(userId, rows, friendshipByOtherId)
  },

  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.findFriendshipBetween(userId, otherUserId)
    return friendship?.status === 'accepted'
  },

  async getRelationForUser(
    userId: string,
    otherUserId: string
  ): Promise<{
    relationStatus: FriendRelationStatus
    friendshipId: string | null
  }> {
    if (userId === otherUserId) {
      return { relationStatus: 'none', friendshipId: null }
    }

    const friendship = await this.findFriendshipBetween(userId, otherUserId)
    return {
      relationStatus: getRelationStatus(userId, otherUserId, friendship),
      friendshipId: friendship?.id ?? null,
    }
  },
})
