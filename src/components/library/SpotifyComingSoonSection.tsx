'use client'

import Image from 'next/image'
import { ArrowDownTrayIcon, CheckIcon } from '@heroicons/react/24/outline'
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
      <div className="flex w-full items-center overflow-hidden rounded-xl bg-[#011E0B] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex h-20 shrink-0 items-center sm:h-24">
          <Image
            src="/spotify_logo_V2.png"
            alt=""
            width={756}
            height={846}
            aria-hidden
            className="h-16 w-auto object-contain sm:h-full"
          />
        </div>

        <div className="ml-3 flex min-w-0 flex-1 items-center sm:ml-4">
          <div className="flex min-w-0 flex-1 flex-col justify-center py-2 sm:py-2.5">
            <Image
              src="/spotify_text.png"
              alt="Spotify"
              width={637}
              height={287}
              className="h-9 w-[100px] shrink-0 object-contain mix-blend-screen min-[400px]:h-10 min-[400px]:w-[112px] sm:h-11 sm:w-[124px]"
            />
            <p className="truncate pl-2.5 text-[10px] leading-tight text-white/80 min-[400px]:pl-3 min-[400px]:text-xs sm:hidden">
              {t('library.spotifyDescriptionShort')}
            </p>
            <p className="hidden truncate pl-3.5 text-sm text-white/80 sm:block">
              {t('library.spotifyDescription')}
            </p>
          </div>

          <div className="ml-2 flex shrink-0 items-center sm:ml-3">
            {isConnected ? (
              <div className="flex min-w-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 sm:min-w-[5.5rem] sm:flex-row sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5">
                <CheckIcon className="h-4 w-4 shrink-0 text-white/90 sm:h-5 sm:w-5" aria-hidden />
                <span className="text-[10px] font-semibold leading-none text-white/90 sm:text-xs">
                  {t('library.spotifyConnected')}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSpotifyConnect}
                className="flex min-w-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-lg bg-[#1DB954] px-3 py-2 text-center transition-colors hover:bg-[#1ed760] sm:min-w-[5.5rem] sm:flex-row sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5"
              >
                <ArrowDownTrayIcon className="h-4 w-4 shrink-0 text-black sm:h-5 sm:w-5" aria-hidden />
                <span className="text-[10px] font-bold leading-none text-black sm:text-sm">
                  {t('library.spotifyImport')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
