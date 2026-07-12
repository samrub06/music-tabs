'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import type { UserNotification } from '@/types'
import {
  acceptFriendRequestFromNotificationAction,
  declineFriendRequestFromNotificationAction,
  getNotificationsAction,
  getUnreadNotificationCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/(protected)/notifications/actions'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { getNotificationHref } from '@/utils/notificationNavigation'
export default function NotificationBell() {
  const { t } = useLanguage()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [resolvedFriendRequestIds, setResolvedFriendRequestIds] = useState<Set<string>>(
    () => new Set()
  )
  const [pending, startTransition] = useTransition()

  const refreshCount = useCallback(() => {
    getUnreadNotificationCountAction().then(setUnreadCount).catch(console.error)
  }, [])

  const refreshNotifications = useCallback(() => {
    getNotificationsAction().then(setNotifications).catch(console.error)
  }, [])

  useEffect(() => {
    refreshCount()
    const interval = window.setInterval(refreshCount, 60000)
    return () => window.clearInterval(interval)
  }, [refreshCount])

  useEffect(() => {
    if (!open) return
    refreshNotifications()
  }, [open, refreshNotifications])

  const handleOpenNotification = (notification: UserNotification) => {
    startTransition(async () => {
      if (!notification.readAt) {
        await markNotificationReadAction(notification.id)
        refreshCount()
      }
      const href = getNotificationHref(notification)
      if (href) {
        setOpen(false)
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
      refreshCount()
      refreshNotifications()
    })
  }

  const handleDecline = (notification: UserNotification) => {
    if (!notification.entityId) return
    startTransition(async () => {
      await declineFriendRequestFromNotificationAction(notification.entityId!)
      await markNotificationReadAction(notification.id)
      setResolvedFriendRequestIds((current) => new Set(current).add(notification.id))
      refreshCount()
      refreshNotifications()
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 shrink-0 sm:min-w-9"
          aria-label={t('notifications.title')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            {t('notifications.title')}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await markAllNotificationsReadAction()
                  refreshCount()
                  refreshNotifications()
                })
              }}
              className="text-xs text-primary hover:underline"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t('notifications.empty')}
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'border-b border-border/60 px-3 py-2.5 last:border-0',
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
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  setOpen(false)
                  router.push('/notifications')
                }}
              >
                {t('notifications.seeAll')}
              </button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
