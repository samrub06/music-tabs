import type { UserNotification } from '@/types'

export function getNotificationHref(notification: UserNotification): string | null {
  if (notification.type === 'song_shared' && notification.entityId) {
    return `/song/${notification.entityId}`
  }
  if (notification.type === 'playlist_shared' && notification.entityId) {
    return `/jams/${notification.entityId}`
  }
  if (
    notification.type === 'friend_request' ||
    notification.type === 'friend_accepted' ||
    notification.type === 'invitation_accepted'
  ) {
    return '/friends'
  }
  return null
}
