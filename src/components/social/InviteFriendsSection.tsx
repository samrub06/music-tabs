'use client'

import { useEffect, useState, useTransition } from 'react'
import type { AppInvitation } from '@/types'
import {
  createInvitationAction,
  getMyInvitationsAction,
} from '@/app/(protected)/onboarding/actions'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckIcon, LinkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

export default function InviteFriendsSection() {
  const { t } = useLanguage()
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [latestLink, setLatestLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [invitations, setInvitations] = useState<AppInvitation[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getMyInvitationsAction().then(setInvitations).catch(console.error)
  }, [])

  const buildInviteUrl = (code: string) => {
    if (typeof window === 'undefined') return `/invite/${code}`
    return `${window.location.origin}/invite/${code}`
  }

  const handleCreateInvitation = () => {
    startTransition(async () => {
      try {
        const invitation = await createInvitationAction({
          inviteeEmail: inviteeEmail.trim() || null,
        })
        const url = buildInviteUrl(invitation.code)
        setLatestLink(url)
        setInviteeEmail('')
        const updated = await getMyInvitationsAction()
        setInvitations(updated)
      } catch (error) {
        console.error(error)
      }
    })
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error(error)
    }
  }

  const pendingInvites = invitations.filter((inv) => inv.status === 'pending')

  return (
    <div className="mb-6 rounded-2xl border border-black/[0.06] bg-muted/30 p-4 dark:border-white/[0.08]">
      <h2 className="text-sm font-semibold text-foreground">{t('invitations.sendTitle')}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t('invitations.sendDescription')}</p>

      <div className="mt-4 space-y-3">
        <Input
          type="email"
          value={inviteeEmail}
          onChange={(e) => setInviteeEmail(e.target.value)}
          placeholder={t('invitations.emailOptional')}
          className="rounded-xl"
        />
        <Button
          type="button"
          className="w-full rounded-xl"
          disabled={pending}
          onClick={handleCreateInvitation}
        >
          <PaperAirplaneIcon className="mr-1.5 h-4 w-4" />
          {t('invitations.createLink')}
        </Button>

        {latestLink && (
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              {t('invitations.latestLink')}
            </p>
            <div className="flex gap-2">
              <Input readOnly value={latestLink} className="rounded-xl text-xs" />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl"
                onClick={() => void handleCopy(latestLink)}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t('invitations.pendingCount').replace('{count}', String(pendingInvites.length))}
          </p>
          <div className="space-y-2">
            {pendingInvites.slice(0, 3).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {invitation.inviteeEmail || invitation.code}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-primary hover:underline"
                  onClick={() => void handleCopy(buildInviteUrl(invitation.code))}
                >
                  {t('invitations.copy')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
