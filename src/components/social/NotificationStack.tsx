'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { UserNotification } from '@/types'
import {
  getNotificationsAction,
  markNotificationReadAction,
} from '@/app/(protected)/notifications/actions'
import { getNotificationHref } from '@/utils/notificationNavigation'
import {
  emitNotificationsChanged,
  NOTIFICATIONS_CHANGED_EVENT,
} from '@/utils/notificationEvents'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

const SESSION_BURST_KEY = 'tabasco:notif-stack-burst'
const POLL_MS = 18000
const MAX_VISIBLE = 3
const SWIPE_DISMISS_PX = 96

type StackCard = UserNotification & { exiting?: boolean }

function readBurstShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_BURST_KEY) === '1'
  } catch {
    return false
  }
}

function markBurstShown(): void {
  try {
    sessionStorage.setItem(SESSION_BURST_KEY, '1')
  } catch {
    // ignore
  }
}

export default function NotificationStack() {
  const { user, loading } = useAuthContext()
  const { t } = useLanguage()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [cards, setCards] = useState<StackCard[]>([])
  const knownIdsRef = useRef<Set<string>>(new Set())
  const dragRef = useRef<{ id: string; startX: number; dx: number } | null>(null)
  const [, setDragTick] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pushUnread = useCallback((list: UserNotification[], mode: 'burst' | 'live') => {
    const unread = list.filter((n) => !n.readAt)
    if (unread.length === 0) return

    if (mode === 'burst') {
      knownIdsRef.current = new Set(unread.map((n) => n.id))
      setCards(unread.slice(0, MAX_VISIBLE + 2))
      markBurstShown()
      return
    }

    const fresh = unread.filter((n) => !knownIdsRef.current.has(n.id))
    if (fresh.length === 0) {
      for (const n of unread) knownIdsRef.current.add(n.id)
      return
    }
    for (const n of fresh) knownIdsRef.current.add(n.id)
    setCards((prev) => {
      const existing = new Set(prev.map((c) => c.id))
      const next = [...fresh.filter((n) => !existing.has(n.id)), ...prev]
      return next.slice(0, MAX_VISIBLE + 2)
    })
  }, [])

  const refresh = useCallback(
    async (mode: 'burst' | 'live') => {
      if (!user) return
      try {
        const list = await getNotificationsAction()
        pushUnread(list, mode)
      } catch (error) {
        console.error('NotificationStack refresh failed:', error)
      }
    },
    [user, pushUnread]
  )

  // After login / session ready: show unread stack once per session
  useEffect(() => {
    if (loading || !user) return
    if (readBurstShown()) {
      void getNotificationsAction()
        .then((list) => {
          for (const n of list.filter((x) => !x.readAt)) {
            knownIdsRef.current.add(n.id)
          }
        })
        .catch(() => {})
      return
    }
    void refresh('burst')
  }, [loading, user, refresh])

  // Live poll for new notifications during the session
  useEffect(() => {
    if (loading || !user) return
    const id = window.setInterval(() => {
      void refresh('live')
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [loading, user, refresh])

  // Drop stack cards that were marked read elsewhere (bell / center)
  useEffect(() => {
    const onChanged = () => {
      void getNotificationsAction()
        .then((list) => {
          const unreadIds = new Set(list.filter((n) => !n.readAt).map((n) => n.id))
          setCards((prev) => prev.filter((c) => unreadIds.has(c.id) || c.exiting))
        })
        .catch(() => {})
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
  }, [])

  const dismissCard = useCallback(async (notification: UserNotification, navigate: boolean) => {
    setCards((prev) =>
      prev.map((c) => (c.id === notification.id ? { ...c, exiting: true } : c))
    )
    window.setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== notification.id))
    }, 220)

    try {
      if (!notification.readAt) {
        await markNotificationReadAction(notification.id)
        emitNotificationsChanged()
      }
    } catch (error) {
      console.error('Failed to mark notification read:', error)
    }

    if (navigate) {
      const href = getNotificationHref(notification)
      if (href) router.push(href)
    }
  }, [router])

  const onPointerDown = (id: string, clientX: number) => {
    dragRef.current = { id, startX: clientX, dx: 0 }
    setDragTick((n) => n + 1)
  }

  const onPointerMove = (clientX: number) => {
    if (!dragRef.current) return
    dragRef.current.dx = clientX - dragRef.current.startX
    setDragTick((n) => n + 1)
  }

  const onPointerUp = (notification: UserNotification) => {
    const drag = dragRef.current
    dragRef.current = null
    setDragTick((n) => n + 1)
    if (!drag || drag.id !== notification.id) return
    if (Math.abs(drag.dx) >= SWIPE_DISMISS_PX) {
      void dismissCard(notification, false)
      return
    }
  }

  if (!mounted || !user || cards.length === 0) return null

  const visible = cards.filter((c) => !c.exiting).slice(0, MAX_VISIBLE)
  const overflow = Math.max(0, cards.filter((c) => !c.exiting).length - MAX_VISIBLE)

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div className="relative w-full max-w-md">
        {visible.map((card, index) => {
          const drag = dragRef.current?.id === card.id ? dragRef.current.dx : 0
          const stackOffset = index * 8
          const scale = 1 - index * 0.03
          return (
            <div
              key={card.id}
              className={cn(
                'pointer-events-auto absolute inset-x-0 transition-all duration-200 ease-out',
                card.exiting && 'translate-x-full opacity-0'
              )}
              style={{
                top: stackOffset,
                zIndex: MAX_VISIBLE - index,
                transform: `translateX(${drag}px) scale(${scale})`,
                opacity: card.exiting ? 0 : 1 - index * 0.08,
              }}
              onPointerDown={(e) => {
                ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
                onPointerDown(card.id, e.clientX)
              }}
              onPointerMove={(e) => onPointerMove(e.clientX)}
              onPointerUp={() => onPointerUp(card)}
              onPointerCancel={() => {
                dragRef.current = null
                setDragTick((n) => n + 1)
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (Math.abs(dragRef.current?.dx ?? 0) > 12) return
                  void dismissCard(card, true)
                }}
                className={cn(
                  'w-full rounded-2xl border border-black/[0.08] bg-background/95 p-3.5 text-start shadow-[0_8px_32px_-8px_rgba(0,0,0,0.28)] backdrop-blur-xl',
                  'dark:border-white/[0.1] dark:bg-background/95',
                  'active:scale-[0.99] transition-transform'
                )}
              >
                <p className="text-sm font-semibold text-foreground line-clamp-1">{card.title}</p>
                {card.message ? (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{card.message}</p>
                ) : null}
                <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/80">
                  {t('notifications.swipeToRead')}
                </p>
              </button>
            </div>
          )
        })}
        {overflow > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-6 text-center text-[11px] font-medium text-muted-foreground"
            style={{ top: MAX_VISIBLE * 8 + 88 }}
          >
            +{overflow}
          </div>
        ) : null}
        {/* Spacer so absolute stack doesn't collapse parent height for hit-testing top cards */}
        <div style={{ height: 100 + (visible.length - 1) * 8 + (overflow > 0 ? 20 : 0) }} />
      </div>
    </div>,
    document.body
  )
}
