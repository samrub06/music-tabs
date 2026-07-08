'use server'

import { revalidatePath } from 'next/cache'
import { createActionServerClient } from '@/lib/supabase/server'
import { friendsRepo } from '@/lib/services/friendsRepo'
import { notificationsRepo } from '@/lib/services/notificationsRepo'
import {
  friendshipIdSchema,
  friendRelationUserIdSchema,
  searchUsersSchema,
  sendFriendRequestSchema,
  shareWithFriendSchema,
} from '@/lib/validation/schemas'
import type { FriendProfile, FriendRelationStatus } from '@/types'

async function getCurrentUserId() {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function getFriendsAction(): Promise<FriendProfile[]> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return friendsRepo(supabase).getAcceptedFriends(userId)
}

export async function getPendingReceivedRequestsAction(): Promise<FriendProfile[]> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return friendsRepo(supabase).getPendingReceivedRequests(userId)
}

export async function getDiscoverableUsersAction(): Promise<FriendProfile[]> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return friendsRepo(supabase).getDiscoverableUsers(userId)
}

export async function searchUsersAction(query: string): Promise<FriendProfile[]> {
  const { query: validatedQuery } = searchUsersSchema.parse({ query })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return friendsRepo(supabase).searchUsers(userId, validatedQuery)
}

export async function sendFriendRequestAction(addresseeId: string) {
  const { addresseeId: validatedAddresseeId } = sendFriendRequestSchema.parse({ addresseeId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const friends = friendsRepo(supabase)
  const notifications = notificationsRepo(supabase)

  const friendship = await friends.sendFriendRequest(userId, validatedAddresseeId)

  if (friendship.status === 'pending' && friendship.requesterId === userId) {
    const { data: requesterProfile } = await (supabase.from('profiles') as any)
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const requesterName =
      (requesterProfile as { full_name?: string | null; email?: string } | null)?.full_name ||
      (requesterProfile as { full_name?: string | null; email?: string } | null)?.email ||
      'Someone'

    try {
      await notifications.createNotification({
        userId: validatedAddresseeId,
        actorId: userId,
        type: 'friend_request',
        entityType: 'friendship',
        entityId: friendship.id,
        title: 'New friend request',
        message: `${requesterName} wants to be your friend`,
      })
    } catch (error) {
      console.error('Failed to create friend request notification:', error)
    }
  } else if (friendship.status === 'accepted') {
    const { data: accepterProfile } = await (supabase.from('profiles') as any)
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const accepterName =
      (accepterProfile as { full_name?: string | null; email?: string } | null)?.full_name ||
      (accepterProfile as { full_name?: string | null; email?: string } | null)?.email ||
      'Someone'
    const notifyUserId =
      friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId

    try {
      await notifications.createNotification({
        userId: notifyUserId,
        actorId: userId,
        type: 'friend_accepted',
        entityType: 'friendship',
        entityId: friendship.id,
        title: 'Friend request accepted',
        message: `${accepterName} accepted your friend request`,
      })
    } catch (error) {
      console.error('Failed to create friend accepted notification:', error)
    }
  }

  revalidatePath('/friends')
  revalidatePath('/notifications')
  return friendship
}

export async function acceptFriendRequestAction(friendshipId: string) {
  const { friendshipId: validatedId } = friendshipIdSchema.parse({ friendshipId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const friends = friendsRepo(supabase)
  const notifications = notificationsRepo(supabase)
  const friendship = await friends.acceptFriendRequest(validatedId, userId)

  const { data: accepterProfile } = await (supabase.from('profiles') as any)
    .select('full_name, email')
    .eq('id', userId)
    .single()

  const accepterName =
    (accepterProfile as { full_name?: string | null; email?: string } | null)?.full_name ||
    (accepterProfile as { full_name?: string | null; email?: string } | null)?.email ||
    'Someone'

  await notifications.createNotification({
    userId: friendship.requesterId,
    actorId: userId,
    type: 'friend_accepted',
    entityType: 'friendship',
    entityId: friendship.id,
    title: 'Friend request accepted',
    message: `${accepterName} accepted your friend request`,
  })

  revalidatePath('/friends')
  revalidatePath('/notifications')
  return friendship
}

export async function declineFriendRequestAction(friendshipId: string) {
  const { friendshipId: validatedId } = friendshipIdSchema.parse({ friendshipId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await friendsRepo(supabase).declineFriendRequest(validatedId, userId)
  revalidatePath('/friends')
  revalidatePath('/notifications')
}

export async function cancelFriendRequestAction(friendshipId: string) {
  const { friendshipId: validatedId } = friendshipIdSchema.parse({ friendshipId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await friendsRepo(supabase).cancelFriendRequest(validatedId, userId)
  revalidatePath('/friends')
  revalidatePath('/notifications')
}

export async function removeFriendAction(friendshipId: string) {
  const { friendshipId: validatedId } = friendshipIdSchema.parse({ friendshipId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await friendsRepo(supabase).removeFriend(validatedId, userId)
  revalidatePath('/friends')
}

export async function getFriendRelationAction(userId: string): Promise<{
  relationStatus: FriendRelationStatus
  friendshipId: string | null
}> {
  const { userId: otherUserId } = friendRelationUserIdSchema.parse({ userId })
  const { supabase, userId: currentUserId } = await getCurrentUserId()
  if (!currentUserId) {
    return { relationStatus: 'none', friendshipId: null }
  }

  return friendsRepo(supabase).getRelationForUser(currentUserId, otherUserId)
}

export async function shareWithFriendAction(payload: unknown) {
  const validated = shareWithFriendSchema.parse(payload)
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const friends = friendsRepo(supabase)
  const notifications = notificationsRepo(supabase)

  const areFriends = await friends.areFriends(userId, validated.friendUserId)
  if (!areFriends) {
    throw new Error('You can only share with friends')
  }

  const { data: ownerProfile } = await (supabase.from('profiles') as any)
    .select('full_name, email')
    .eq('id', userId)
    .single()

  const ownerName =
    (ownerProfile as { full_name?: string | null; email?: string } | null)?.full_name ||
    (ownerProfile as { full_name?: string | null; email?: string } | null)?.email ||
    'Someone'

  await notifications.shareItem({
    ownerId: userId,
    sharedWithId: validated.friendUserId,
    entityType: validated.entityType,
    entityId: validated.entityId,
    title:
      validated.entityType === 'song'
        ? 'Song shared with you'
        : 'Playlist shared with you',
    message: `${ownerName} shared "${validated.entityTitle}" with you`,
  })

  revalidatePath('/friends')
}
