import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { NotificationType, SharedEntityType, UserNotification } from '@/types'

type NotificationRow = Database['public']['Tables']['user_notifications']['Row']

function mapDbNotificationToDomain(
  row: NotificationRow,
  actor?: { full_name: string | null; email: string; avatar_url: string | null } | null
): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    type: row.type as NotificationType,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    message: row.message,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
    actor: actor
      ? {
          fullName: actor.full_name,
          email: actor.email,
          avatarUrl: actor.avatar_url,
        }
      : null,
  }
}

export const notificationsRepo = (client: SupabaseClient<Database>) => ({
  async createNotification(input: {
    userId: string
    actorId: string
    type: NotificationType
    entityType?: string | null
    entityId?: string | null
    title: string
    message?: string | null
  }): Promise<UserNotification> {
    const { data, error } = await (client.rpc as any)('create_user_notification', {
      p_user_id: input.userId,
      p_type: input.type,
      p_title: input.title,
      p_message: input.message ?? null,
      p_entity_type: input.entityType ?? null,
      p_entity_id: input.entityId ?? null,
    })

    if (error) throw error
    return mapDbNotificationToDomain(data as NotificationRow)
  },

  async getNotifications(userId: string, limit: number = 30): Promise<UserNotification[]> {
    const { data, error } = await client
      .from('user_notifications')
      .select('id, user_id, actor_id, type, entity_type, entity_id, title, message, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const rows = (data || []) as NotificationRow[]
    const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter(Boolean))) as string[]

    const actorMap = new Map<string, { full_name: string | null; email: string; avatar_url: string | null }>()
    if (actorIds.length > 0) {
      const { data: actors, error: actorsError } = await client
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', actorIds)

      if (actorsError) throw actorsError
      for (const actor of (actors || []) as Array<{ id: string; full_name: string | null; email: string; avatar_url: string | null }>) {
        actorMap.set(actor.id, actor)
      }
    }

    return rows.map((row) =>
      mapDbNotificationToDomain(row, row.actor_id ? actorMap.get(row.actor_id) ?? null : null)
    )
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await client
      .from('user_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw error
    return count ?? 0
  },

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await (client.from('user_notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await (client.from('user_notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw error
  },

  async shareItem(input: {
    ownerId: string
    sharedWithId: string
    entityType: SharedEntityType
    entityId: string
    title: string
    message: string
  }): Promise<void> {
    const { error: shareError } = await (client.from('shared_items') as any)
      .upsert(
        {
          owner_id: input.ownerId,
          shared_with_id: input.sharedWithId,
          entity_type: input.entityType,
          entity_id: input.entityId,
        },
        { onConflict: 'owner_id,shared_with_id,entity_type,entity_id' }
      )

    if (shareError) throw shareError

    await this.createNotification({
      userId: input.sharedWithId,
      actorId: input.ownerId,
      type: input.entityType === 'song' ? 'song_shared' : 'playlist_shared',
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      message: input.message,
    })
  },
})
