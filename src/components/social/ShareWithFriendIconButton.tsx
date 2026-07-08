'use client'

import { useState, type MouseEvent } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import type { SharedEntityType } from '@/types'
import { useLanguage } from '@/context/LanguageContext'
import ShareWithFriendDialog from '@/components/social/ShareWithFriendDialog'
import { cn } from '@/lib/utils'

interface ShareWithFriendIconButtonProps {
  entityType: SharedEntityType
  entityId: string
  entityTitle: string
  className?: string
  iconClassName?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

export default function ShareWithFriendIconButton({
  entityType,
  entityId,
  entityTitle,
  className,
  iconClassName,
  onClick,
}: ShareWithFriendIconButtonProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onClick?.(event)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className
        )}
        aria-label={t('friends.shareWithFriend')}
        title={t('friends.shareWithFriend')}
      >
        <ShareIcon className={cn('h-5 w-5', iconClassName)} aria-hidden />
      </button>
      <ShareWithFriendDialog
        open={open}
        onOpenChange={setOpen}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
      />
    </>
  )
}
