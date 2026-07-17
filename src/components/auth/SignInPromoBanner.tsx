'use client'

import { useLanguage } from '@/context/LanguageContext'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

interface SignInPromoBannerProps {
  onSignIn: () => void
}

function DescriptionWithRainbowFree({
  template,
  freeWord,
}: {
  template: string
  freeWord: string
}) {
  const parts = template.split('{free}')
  return (
    <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-white/75 sm:text-[11px]">
      {parts[0]}
      <span className="animate-rainbow-text font-bold">{freeWord}</span>
      {parts[1] ?? ''}
    </p>
  )
}

/** Compact sticky Google sign-in bar for guest song view. */
export function SignInPromoBanner({ onSignIn }: SignInPromoBannerProps) {
  const { t } = useLanguage()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-4">
      <div className="pointer-events-auto relative mx-auto max-w-4xl overflow-hidden rounded-xl bg-[#202124] shadow-[0_-8px_28px_-10px_rgba(0,0,0,0.45)]">
        <div className="relative z-10 flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
              {t('songContent.FULL_SONG_HIDDEN_TITLE')}
            </h2>
            <DescriptionWithRainbowFree
              template={t('songContent.FULL_SONG_HIDDEN_DESCRIPTION')}
              freeWord={t('songContent.signInPromoFree')}
            />
          </div>

          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[10px] font-bold uppercase tracking-wide text-[#202124] transition-colors hover:bg-white/90 sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
          >
            <GoogleIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="max-sm:sr-only">{t('auth.signInWithGoogle')}</span>
            <span className="sm:hidden">{t('auth.signIn')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
