export const NOTIFICATIONS_CHANGED_EVENT = 'tabasco:notifications-changed'

export function emitNotificationsChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT))
}
