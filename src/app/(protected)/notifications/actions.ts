'use server'

import { revalidatePath } from 'next/cache'
import { createActionServerClient } from '@/lib/supabase/server'
import { notificationsRepo } from '@/lib/services/notificationsRepo'
import { acceptFriendRequestAction } from '@/app/(protected)/friends/actions'
import { friendshipIdSchema, notificationIdSchema } from '@/lib/validation/schemas'
import type { UserNotification } from '@/types'

async function getCurrentUserId() {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function getNotificationsAction(): Promise<UserNotification[]> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return notificationsRepo(supabase).getNotifications(userId)
}

export async function getUnreadNotificationCountAction(): Promise<number> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return 0
  return notificationsRepo(supabase).getUnreadCount(userId)
}

export async function markNotificationReadAction(notificationId: string) {
  const { notificationId: validatedId } = notificationIdSchema.parse({ notificationId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await notificationsRepo(supabase).markAsRead(validatedId, userId)
  revalidatePath('/notifications')
  revalidatePath('/friends')
}

export async function markAllNotificationsReadAction() {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await notificationsRepo(supabase).markAllAsRead(userId)
  revalidatePath('/notifications')
  revalidatePath('/friends')
}

export async function acceptFriendRequestFromNotificationAction(friendshipId: string) {
  await acceptFriendRequestAction(friendshipId)
  revalidatePath('/notifications')
}

export async function declineFriendRequestFromNotificationAction(friendshipId: string) {
  const { friendshipId: validatedId } = friendshipIdSchema.parse({ friendshipId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const { friendsRepo } = await import('@/lib/services/friendsRepo')
  await friendsRepo(supabase).declineFriendRequest(validatedId, userId)
  revalidatePath('/notifications')
  revalidatePath('/friends')
}
