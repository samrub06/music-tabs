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

/** Large decorative Google G for the hero panel (same role as Spotify logo). */
function GoogleMarkDecorative({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.99 29.93 1 24 1 15.4 1 7.96 5.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

interface SignInPromoBannerProps {
  onSignIn: () => void
}

/**
 * End-of-song Google sign-in promo — same hero layout as Spotify / practice banners.
 */
export function SignInPromoBanner({ onSignIn }: SignInPromoBannerProps) {
  const { t } = useLanguage()

  return (
    <section className="pt-2">
      <div className="relative min-h-[8.5rem] w-full overflow-hidden rounded-xl bg-[#202124] sm:min-h-[9.5rem]">
        <span className="absolute end-2.5 top-2.5 z-20 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
          {t('songContent.signInPromoBadge')}
        </span>

        {/* Decorative mark capped at half width so left copy stays clear */}
        <div
          className="pointer-events-none absolute inset-y-0 end-0 w-1/2 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -bottom-10 -end-8 sm:-bottom-14 sm:-end-6">
            <GoogleMarkDecorative className="h-44 w-44 rotate-[18deg] opacity-90 sm:h-56 sm:w-56" />
          </div>
        </div>

        <div className="relative z-10 flex min-h-[8.5rem] flex-col items-start justify-between p-5 sm:min-h-[9.5rem] sm:p-6">
          <div className="flex min-w-0 max-w-[55%] flex-col items-start pr-2 sm:max-w-[58%]">
            <div className="flex items-center gap-2">
              <GoogleIcon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
              <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                {t('songContent.FULL_SONG_HIDDEN_TITLE')}
              </h2>
            </div>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/80 min-[400px]:text-xs sm:mt-2 sm:max-w-sm sm:text-sm">
              {t('songContent.FULL_SONG_HIDDEN_DESCRIPTION')}
            </p>
          </div>

          <div className="mt-3 shrink-0 sm:mt-4">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#202124] transition-colors hover:bg-white/90 sm:gap-2.5 sm:px-5 sm:text-sm"
            >
              <GoogleIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span>{t('auth.signInWithGoogle')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
