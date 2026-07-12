'use client'

import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { InvitationPreview } from '@/types'
import { AppLogo } from '@/components/AppLogo'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { redeemInvitationAction } from '@/app/(protected)/onboarding/actions'

interface InviteLandingClientProps {
  code: string
  preview: InvitationPreview | null
}

export default function InviteLandingClient({ code, preview }: InviteLandingClientProps) {
  const { t } = useLanguage()
  const { user, loading, signInWithGoogle } = useAuthContext()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const inviterName = preview?.inviterName ?? t('invitations.someone')
  const isValid = preview?.status === 'pending'

  const handleJoin = () => {
    if (user) {
      startTransition(async () => {
        await redeemInvitationAction(code)
        router.push('/onboarding')
      })
      return
    }

    void signInWithGoogle(`/onboarding?invite=${code}`)
  }

  return (
    <div className="flex min-h-[calc(100vh-2.75rem)] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-card p-6 text-center shadow-sm dark:border-white/[0.08] sm:p-8">
        <AppLogo variant="portrait" className="mx-auto mb-6 h-12 w-12" />

        {preview?.inviterAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.inviterAvatarUrl}
            alt=""
            className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {inviterName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground">
          {t('invitations.landingTitle').replace('{name}', inviterName)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isValid ? t('invitations.landingDescription') : t('invitations.invalid')}
        </p>

        {isValid && (
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              disabled={loading || pending}
              onClick={handleJoin}
            >
              {user ? t('invitations.continueOnboarding') : t('invitations.joinWithGoogle')}
            </Button>
            {!user && (
              <p className="text-xs text-muted-foreground">{t('invitations.freeToJoin')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
