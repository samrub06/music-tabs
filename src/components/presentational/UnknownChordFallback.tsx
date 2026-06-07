'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import { requestChordAction } from '@/app/(protected)/chords/actions'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import type { InstrumentType } from '@/types'

interface UnknownChordFallbackProps {
  chordName: string
  instrument: InstrumentType
  isAuthenticated?: boolean
}

export default function UnknownChordFallback({
  chordName,
  instrument,
  isAuthenticated = true,
}: UnknownChordFallbackProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNotify = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await requestChordAction({ chordName, instrument })
        setRequested(true)
      } catch (err) {
        console.error('Error requesting chord:', err)
        setError(t('chords.notifyError'))
      }
    })
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-base font-medium text-muted-foreground sm:text-lg">
        {t('chords.forgotChord')}
      </p>
      <Button
        type="button"
        variant={requested ? 'secondary' : 'default'}
        className="mt-5 h-11 rounded-xl px-5 font-medium"
        onClick={handleNotify}
        disabled={pending || requested}
      >
        {requested ? (
          <>
            <CheckIcon className="h-4 w-4" aria-hidden />
            {t('chords.notifyRequested')}
          </>
        ) : pending ? (
          t('chords.notifySending')
        ) : (
          <>
            <BellIcon className="h-4 w-4" aria-hidden />
            {t('chords.notifyToAdd')}
          </>
        )}
      </Button>
      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
