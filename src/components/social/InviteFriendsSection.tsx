'use client'

import { useEffect, useState, useTransition } from 'react'
import type { AppInvitation } from '@/types'
import {
  cancelInvitationAction,
  createInvitationAction,
  getMyInvitationsAction,
} from '@/app/(protected)/onboarding/actions'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthContext } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckIcon,
  EnvelopeIcon,
  LinkIcon,
  ShareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  buildInviteMailto,
  normalizeInviteeEmailField,
  parseInviteeEmails,
  shareOrCopyInviteLink,
  validateInviteeEmails,
} from '@/utils/inviteShare'

export default function InviteFriendsSection() {
  const { t } = useLanguage()
  const { profile } = useAuthContext()
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [latestLink, setLatestLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<AppInvitation[]>([])
  const [pending, startTransition] = useTransition()

  const inviterName =
    profile?.full_name?.trim() || profile?.email?.trim() || t('invitations.someone')

  useEffect(() => {
    getMyInvitationsAction().then(setInvitations).catch(console.error)
  }, [])

  const buildInviteUrl = (code: string) => {
    if (typeof window === 'undefined') return `/invite/${code}`
    return `${window.location.origin}/invite/${code}`
  }

  const parseEmailsOrShowError = (): string[] | null => {
    const invalid = validateInviteeEmails(inviteeEmail)
    if (invalid) {
      setEmailError(t('invitations.invalidEmail').replace('{email}', invalid))
      return null
    }
    setEmailError(null)
    return parseInviteeEmails(inviteeEmail)
  }

  const ensureInviteLink = async (): Promise<{ url: string; emails: string[] } | null> => {
    const emails = parseEmailsOrShowError()
    if (emails === null) return null

    if (latestLink) {
      return { url: latestLink, emails }
    }

    const invitation = await createInvitationAction({
      inviteeEmail: normalizeInviteeEmailField(inviteeEmail),
    })
    const url = buildInviteUrl(invitation.code)
    setLatestLink(url)
    const updated = await getMyInvitationsAction()
    setInvitations(updated)
    return { url, emails }
  }

  const handleShareLink = () => {
    startTransition(async () => {
      try {
        const result = await ensureInviteLink()
        if (!result) return

        const outcome = await shareOrCopyInviteLink({
          url: result.url,
          title: t('invitations.shareTitle'),
          text: t('invitations.shareText'),
        })
        if (outcome === 'copied') {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2000)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error(error)
      }
    })
  }

  const handleSendEmail = () => {
    startTransition(async () => {
      try {
        const result = await ensureInviteLink()
        if (!result) return

        const subject = t('invitations.emailSubject').replace('{name}', inviterName)
        const body = t('invitations.emailBody')
          .replace('{name}', inviterName)
          .replace('{link}', result.url)

        const mailto = buildInviteMailto({
          emails: result.emails,
          inviteUrl: result.url,
          subject,
          body,
        })
        window.location.href = mailto
      } catch (error) {
        console.error(error)
      }
    })
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancelInvitation = (invitation: AppInvitation) => {
    startTransition(async () => {
      try {
        await cancelInvitationAction(invitation.id)
        if (latestLink?.endsWith(`/invite/${invitation.code}`)) {
          setLatestLink(null)
        }
        const updated = await getMyInvitationsAction()
        setInvitations(updated)
      } catch (error) {
        console.error(error)
      }
    })
  }

  const pendingInvites = invitations.filter((inv) => inv.status === 'pending')

  return (
    <div className="mb-6 rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5">
      <h2 className="text-base font-semibold text-foreground">{t('invitations.sendTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('invitations.sendDescription')}</p>

      <div className="mt-4 space-y-3">
        <div>
          <Input
            type="text"
            inputMode="email"
            autoComplete="email"
            value={inviteeEmail}
            onChange={(e) => {
              setInviteeEmail(e.target.value)
              if (emailError) setEmailError(null)
            }}
            placeholder={t('invitations.emailOptional')}
            className="h-10 rounded-xl"
            aria-invalid={!!emailError}
            aria-describedby="invite-email-hint"
          />
          <p id="invite-email-hint" className="mt-1.5 text-[11px] text-muted-foreground">
            {emailError ? (
              <span className="text-destructive">{emailError}</span>
            ) : (
              t('invitations.emailHint')
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-10 min-h-[44px] w-full rounded-xl sm:flex-1"
            disabled={pending}
            onClick={handleShareLink}
          >
            <ShareIcon className="mr-1.5 h-4 w-4" />
            {copied ? t('invitations.copied') : t('invitations.shareLink')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 min-h-[44px] w-full rounded-xl sm:flex-1"
            disabled={pending}
            onClick={handleSendEmail}
          >
            <EnvelopeIcon className="mr-1.5 h-4 w-4" />
            {t('invitations.sendEmail')}
          </Button>
        </div>

        {latestLink && (
          <div className="rounded-xl border border-black/[0.06] bg-background p-3 dark:border-white/[0.08]">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              {t('invitations.latestLink')}
            </p>
            <div className="flex gap-2">
              <Input readOnly value={latestLink} className="rounded-xl text-xs" />
              <Button
                type="button"
                variant="outline"
                className="h-10 min-h-[44px] shrink-0 rounded-xl"
                onClick={() => void handleCopy(latestLink)}
                aria-label={t('invitations.copy')}
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
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => void handleCopy(buildInviteUrl(invitation.code))}
                  >
                    {t('invitations.copy')}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    disabled={pending}
                    aria-label={t('invitations.cancel')}
                    onClick={() => handleCancelInvitation(invitation)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
