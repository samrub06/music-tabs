'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { UserNotification } from '@/types'
import {
  acceptFriendRequestFromNotificationAction,
  declineFriendRequestFromNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from './actions'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { getNotificationHref } from '@/utils/notificationNavigation'
import { cn } from '@/lib/utils'

interface NotificationsClientProps {
  initialNotifications: UserNotification[]
}

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [resolvedFriendRequestIds, setResolvedFriendRequestIds] = useState<Set<string>>(
    () => new Set()
  )
  const [pending, startTransition] = useTransition()

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const handleOpenNotification = (notification: UserNotification) => {
    startTransition(async () => {
      if (!notification.readAt) {
        await markNotificationReadAction(notification.id)
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, readAt: new Date() } : item
          )
        )
      }
      const href = getNotificationHref(notification)
      if (href) {
        router.push(href)
      }
    })
  }

  const handleAccept = (notification: UserNotification) => {
    if (!notification.entityId) return
    startTransition(async () => {
      await acceptFriendRequestFromNotificationAction(notification.entityId!)
      await markNotificationReadAction(notification.id)
      setResolvedFriendRequestIds((current) => new Set(current).add(notification.id))
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date() } : item
        )
      )
    })
  }

  const handleDecline = (notification: UserNotification) => {
    if (!notification.entityId) return
    startTransition(async () => {
      await declineFriendRequestFromNotificationAction(notification.entityId!)
      await markNotificationReadAction(notification.id)
      setResolvedFriendRequestIds((current) => new Set(current).add(notification.id))
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date() } : item
        )
      )
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date() }))
      )
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 hidden text-3xl font-bold text-foreground lg:block">
                {t('notifications.title')}
              </h1>
              <p className="text-muted-foreground">{t('notifications.description')}</p>
            </div>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={handleMarkAllRead}
                className="shrink-0 rounded-xl"
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-muted/30 px-4 py-12 text-center dark:border-white/[0.08]">
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'border-b border-border/60 px-4 py-3 last:border-0',
                    !notification.readAt && 'bg-primary/5'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    {notification.message && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {notification.createdAt.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                  {notification.type === 'friend_request' &&
                    notification.entityId &&
                    !resolvedFriendRequestIds.has(notification.id) && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleAccept(notification)}
                        className="h-7 rounded-lg px-2 text-xs"
                      >
                        {t('friends.accept')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleDecline(notification)}
                        className="h-7 rounded-lg px-2 text-xs"
                      >
                        {t('friends.decline')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
