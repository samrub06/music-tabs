'use client'

import { useEffect, useState, useTransition } from 'react'
import type { FriendRelationStatus, LeaderboardEntry } from '@/types'
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  declineFriendRequestAction,
  getFriendRelationAction,
  removeFriendAction,
  sendFriendRequestAction,
} from '@/app/(protected)/friends/actions'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import { TrophyIcon } from '@heroicons/react/24/solid'

interface LeaderboardUserDialogProps {
  entry: LeaderboardEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isCurrentUser?: boolean
}

function getInitials(name: string | null | undefined, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

export default function LeaderboardUserDialog({
  entry,
  open,
  onOpenChange,
  isCurrentUser = false,
}: LeaderboardUserDialogProps) {
  const { t } = useLanguage()
  const [relationStatus, setRelationStatus] = useState<FriendRelationStatus>('none')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [loadingRelation, setLoadingRelation] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open || !entry || isCurrentUser) {
      setRelationStatus('none')
      setFriendshipId(null)
      setLoadingRelation(false)
      return
    }

    let cancelled = false
    setLoadingRelation(true)

    getFriendRelationAction(entry.userId)
      .then((result) => {
        if (!cancelled) {
          setRelationStatus(result.relationStatus)
          setFriendshipId(result.friendshipId)
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingRelation(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, entry, isCurrentUser])

  const refreshRelation = async () => {
    if (!entry || isCurrentUser) return
    const result = await getFriendRelationAction(entry.userId)
    setRelationStatus(result.relationStatus)
    setFriendshipId(result.friendshipId)
  }

  const handlePrimaryAction = () => {
    if (!entry || isCurrentUser) return

    startTransition(async () => {
      try {
        if (relationStatus === 'friends' && friendshipId) {
          await removeFriendAction(friendshipId)
        } else if (relationStatus === 'pending_sent' && friendshipId) {
          await cancelFriendRequestAction(friendshipId)
        } else if (relationStatus === 'pending_received' && friendshipId) {
          await acceptFriendRequestAction(friendshipId)
        } else {
          await sendFriendRequestAction(entry.userId)
        }
        await refreshRelation()
      } catch (error) {
        console.error(error)
      }
    })
  }

  const handleDecline = () => {
    if (!friendshipId) return
    startTransition(async () => {
      try {
        await declineFriendRequestAction(friendshipId)
        await refreshRelation()
      } catch (error) {
        console.error(error)
      }
    })
  }

  if (!entry) return null

  const displayName = entry.fullName || entry.email || t('gamification.UNKNOWN_USER')

  const renderFriendActions = () => {
    if (isCurrentUser) {
      return (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm text-primary">
          {t('gamification.YOU_BADGE')}
        </p>
      )
    }

    if (loadingRelation) {
      return (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {t('common.loading')}
        </p>
      )
    }

    switch (relationStatus) {
      case 'friends':
        return (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            disabled={pending || !friendshipId}
            onClick={handlePrimaryAction}
          >
            {t('friends.remove')}
          </Button>
        )
      case 'pending_sent':
        return (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            disabled={pending || !friendshipId}
            onClick={handlePrimaryAction}
          >
            {t('friends.cancelRequest')}
          </Button>
        )
      case 'pending_received':
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={pending || !friendshipId}
              onClick={handlePrimaryAction}
            >
              {t('friends.accept')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={pending || !friendshipId}
              onClick={handleDecline}
            >
              {t('friends.decline')}
            </Button>
          </div>
        )
      default:
        return (
          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={pending}
            onClick={handlePrimaryAction}
          >
            <UserPlusIcon className="mr-1.5 h-4 w-4" />
            {t('friends.addFriend')}
          </Button>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto mb-2">
            {entry.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                {getInitials(entry.fullName, entry.email)}
              </div>
            )}
          </div>
          <DialogTitle className="text-center">{displayName}</DialogTitle>
          <DialogDescription className="text-center">
            {entry.fullName ? entry.email : t('leaderboard.playerProfile')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t('leaderboard.rankColumn')}
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground">#{entry.rank}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t('leaderboard.levelColumn')}
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground">{entry.currentLevel}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center sm:col-span-1 col-span-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t('leaderboard.xpColumn')}
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {entry.totalXp.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border/80 px-3 py-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span>🎵 {t('leaderboard.songsColumn')}</span>
            <span className="font-semibold tabular-nums text-foreground">{entry.songCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>📋 {entry.playlistCount === 1 ? t('leaderboard.playlist') : t('leaderboard.playlists')}</span>
            <span className="font-semibold tabular-nums text-foreground">{entry.playlistCount}</span>
          </div>
          {entry.currentStreak > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span>🔥 {t('leaderboard.streak')}</span>
              <span className="font-semibold tabular-nums text-foreground">{entry.currentStreak}</span>
            </div>
          )}
          {entry.badges.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1">
                <TrophyIcon className="h-4 w-4 text-yellow-500" />
                {t('leaderboard.badges')}
              </span>
              <span className="font-semibold tabular-nums text-foreground">{entry.badges.length}</span>
            </div>
          )}
        </div>

        {renderFriendActions()}
      </DialogContent>
    </Dialog>
  )
}
