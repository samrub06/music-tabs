'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import type { FriendProfile, SharedEntityType } from '@/types'
import { getFriendsAction, shareWithFriendAction } from '@/app/(protected)/friends/actions'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShareWithFriendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: SharedEntityType
  entityId: string
  entityTitle: string
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

function buildSharePath(entityType: SharedEntityType, entityId: string): string {
  return entityType === 'song' ? `/song/${entityId}` : `/jams/${entityId}`
}

export default function ShareWithFriendDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityTitle,
}: ShareWithFriendDialogProps) {
  const { t } = useLanguage()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const shareUrl = useMemo(() => {
    const path = buildSharePath(entityType, entityId)
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  }, [entityType, entityId])

  useEffect(() => {
    if (!open) {
      setSelectedFriendId(null)
      setSent(false)
      setCopied(false)
      return
    }

    getFriendsAction().then(setFriends).catch(console.error)
  }, [open])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy share link:', error)
    }
  }

  const handleShare = () => {
    if (!selectedFriendId) return

    startTransition(async () => {
      try {
        await shareWithFriendAction({
          friendUserId: selectedFriendId,
          entityType,
          entityId,
          entityTitle,
        })
        setSent(true)
      } catch (error) {
        console.error(error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex w-[min(100%-1.5rem,28rem)] max-h-[min(85dvh,36rem)] flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:gap-4 sm:p-6',
          'left-1/2 top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] translate-x-[-50%] translate-y-0',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]'
        )}
      >
        <DialogHeader className="shrink-0 space-y-1.5 pr-6 text-left">
          <DialogTitle>{t('friends.shareTitle')}</DialogTitle>
          <DialogDescription className="text-pretty">
            {entityType === 'song'
              ? t('friends.shareSongDescription').replace('{title}', entityTitle)
              : t('friends.sharePlaylistDescription').replace('{title}', entityTitle)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-xs sm:text-sm text-muted-foreground" title={shareUrl}>
            {shareUrl}
          </p>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted active:bg-muted/80"
            aria-label={copied ? t('friends.linkCopied') : t('friends.copyLink')}
            title={copied ? t('friends.linkCopied') : t('friends.copyLink')}
          >
            {copied ? (
              <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ClipboardDocumentIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {sent ? (
            <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              {t('friends.shareSent')}
            </div>
          ) : friends.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t('friends.noFriendsToShare')}
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    selectedFriendId === friend.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {getInitials(friend.fullName, friend.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {friend.fullName || friend.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!sent && friends.length > 0 && (
          <Button
            type="button"
            className="h-11 w-full shrink-0 rounded-xl"
            disabled={!selectedFriendId || pending}
            onClick={handleShare}
          >
            {t('friends.shareAction')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
