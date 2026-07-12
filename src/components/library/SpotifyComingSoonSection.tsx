'use client'

import Image from 'next/image'
// import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

interface SpotifyComingSoonSectionProps {
  spotifyId?: string | null
}

type SpotifyStatus =
  | 'connected'
  | 'denied'
  | 'not_configured'
  | 'unauthorized'
  | 'invalid_state'
  | 'already_linked'
  | 'failed'

export default function SpotifyComingSoonSection({ spotifyId: spotifyIdProp }: SpotifyComingSoonSectionProps) {
  const { t } = useLanguage()
  // const { user, profile, signInWithGoogle, refetchProfile } = useAuthContext()
  const { profile, refetchProfile } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()

  const spotifyStatus = searchParams.get('spotify') as SpotifyStatus | null

  const statusMessage = useMemo(() => {
    if (!spotifyStatus) return null
    const key = `library.spotifyStatus.${spotifyStatus}` as const
    const translated = t(key)
    return translated === key ? null : translated
  }, [spotifyStatus, t])

  useEffect(() => {
    if (!spotifyStatus) return

    if (spotifyStatus === 'connected') {
      void refetchProfile()
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('spotify')
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
  }, [spotifyStatus, refetchProfile, router])

  const isConnected = !!(spotifyIdProp ?? profile?.spotify_id)

  // Temporarily disabled — re-enable with the Connect / Import CTAs below
  // const handleSpotifyConnect = () => {
  //   if (!user) {
  //     void signInWithGoogle('/api/spotify/auth')
  //     return
  //   }
  //   window.location.assign('/api/spotify/auth')
  // }

  return (
    <section className="mb-6">
      <div className="relative min-h-[8.5rem] w-full overflow-hidden rounded-xl bg-[#011E0B] sm:min-h-[9.5rem]">
        <span className="absolute end-2.5 top-2.5 z-20 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
          {t('library.spotifySoon')}
        </span>

        <div className="pointer-events-none absolute -bottom-14 -right-8 sm:-bottom-20 sm:-right-6" aria-hidden>
          <Image
            src="/spotify_logo_V2.png"
            alt=""
            width={756}
            height={846}
            className="h-48 w-auto rotate-[28deg] object-contain opacity-95 sm:h-60"
          />
        </div>

        <div className="relative z-10 flex min-h-[8.5rem] flex-col items-start justify-between p-5 sm:min-h-[9.5rem] sm:p-6">
          <div className="flex min-w-0 max-w-[72%] flex-col items-start justify-start pr-2 sm:max-w-[68%]">
            <Image
              src="/spotify_text.png"
              alt="Spotify"
              width={637}
              height={287}
              className="h-8 w-[5.5rem] shrink-0 object-contain object-left mix-blend-screen min-[400px]:h-9 min-[400px]:w-[6.25rem] sm:h-10 sm:w-[7rem]"
            />
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/80 min-[400px]:text-xs sm:mt-2 sm:max-w-sm sm:text-sm">
              {t('library.spotifyDescription')}
            </p>
          </div>

          <div className="mt-3 shrink-0 sm:mt-4">
            {isConnected ? (
              // Temporarily disabled — Spotify import not ready yet
              // <Link
              //   href="/spotify"
              //   className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/15 sm:gap-2 sm:px-4 sm:py-2"
              // >
              //   <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white/90 sm:h-4 sm:w-4" aria-hidden />
              //   <span className="text-[10px] font-bold uppercase tracking-wide text-white/90 sm:text-xs">
              //     {t('library.spotifyImportPlaylists')}
              //   </span>
              // </Link>
              <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2">
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white/90 sm:h-4 sm:w-4" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/90 sm:text-xs">
                  {t('library.spotifyImportPlaylists')}
                </span>
              </span>
            ) : (
              // Temporarily disabled — Spotify connect not ready yet
              // <button
              //   type="button"
              //   onClick={handleSpotifyConnect}
              //   className="inline-flex items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#1ed760] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
              // >
              //   <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              //   <span>{t('library.spotifyImport')}</span>
              // </button>
              <button
                type="button"
                disabled
                className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black opacity-90 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
              >
                <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                <span>{t('library.spotifyImport')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'mt-2 text-sm',
            spotifyStatus === 'connected'
              ? 'text-green-700 dark:text-green-400'
              : 'text-destructive'
          )}
        >
          {statusMessage}
        </p>
      )}
    </section>
  )
}
