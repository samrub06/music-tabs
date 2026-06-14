'use client'

import Image from 'next/image'
import { ArrowUpRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface SpotifyComingSoonSectionProps {
  spotifyId?: string | null
}

export default function SpotifyComingSoonSection({ spotifyId: spotifyIdProp }: SpotifyComingSoonSectionProps) {
  const { t } = useLanguage()
  const { profile } = useAuthContext()

  const isConnected = !!(spotifyIdProp ?? profile?.spotify_id)

  const handleSpotifyConnect = () => {
    window.location.assign('/api/spotify/auth')
  }

  return (
    <section className="mb-6">
      <div className="relative min-h-[8.5rem] w-full overflow-hidden rounded-xl bg-[#011E0B] sm:min-h-[9.5rem]">
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2">
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white/90 sm:h-4 sm:w-4" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/90 sm:text-xs">
                  {t('library.spotifyConnected')}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSpotifyConnect}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#1ed760] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
              >
                <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                <span>{t('library.spotifyImport')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
