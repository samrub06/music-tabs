'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { completeOnboardingAction } from './actions'
import { AppLogo } from '@/components/AppLogo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Guitar, Piano } from 'lucide-react'

interface OnboardingClientProps {
  inviteCode: string | null
}

export default function OnboardingClient({ inviteCode }: OnboardingClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [preferredInstrument, setPreferredInstrument] = useState<'piano' | 'guitar' | null>(null)
  const [pending, startTransition] = useTransition()

  const finish = () => {
    startTransition(async () => {
      await completeOnboardingAction({
        preferredInstrument,
        inviteCode,
      })
      router.push('/songs')
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-2.75rem)] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-black/[0.06] bg-card p-6 dark:border-white/[0.08] sm:p-8">
        <AppLogo variant="portrait" className="mb-6 h-10 w-10" />

        {step === 0 && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">{t('onboarding.welcomeTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('onboarding.welcomeDescription')}</p>
            {inviteCode && (
              <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                {t('onboarding.inviteConnected')}
              </p>
            )}
            <Button type="button" className="mt-2 h-11 w-full rounded-xl" onClick={() => setStep(1)}>
              {t('onboarding.getStarted')}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">{t('onboarding.instrumentTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.instrumentDescription')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferredInstrument('guitar')}
                className={cn(
                  'rounded-2xl border p-4 text-center transition-all',
                  preferredInstrument === 'guitar'
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <Guitar className="mx-auto mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium">{t('onboarding.guitar')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreferredInstrument('piano')}
                className={cn(
                  'rounded-2xl border p-4 text-center transition-all',
                  preferredInstrument === 'piano'
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <Piano className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">{t('onboarding.piano')}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(0)}>
                {t('common.back')}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl"
                disabled={pending}
                onClick={finish}
              >
                {t('onboarding.finish')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
