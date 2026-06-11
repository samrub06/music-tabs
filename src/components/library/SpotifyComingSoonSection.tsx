'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function SpotifyComingSoonSection() {
  const { t } = useLanguage()

  return (
    <section className="mb-6">
      <h3 className="mb-3 text-base font-semibold text-foreground sm:text-lg">
        {t('library.spotifySection')}
      </h3>
      <div
        className="relative h-28 w-full overflow-hidden rounded-xl sm:h-32"
        aria-disabled
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954] to-[#191414]" />
        <div className="absolute inset-0 flex items-center gap-4 px-5 sm:px-6">
          <Image
            src="/spotify-logo.svg"
            alt="Spotify"
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white sm:text-xl">Spotify</p>
            <p className="truncate text-sm text-white/80">{t('library.spotifyDescription')}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <span className="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold tracking-wide text-white ring-1 ring-white/25">
            {t('common.comingSoon')}
          </span>
        </div>
      </div>
    </section>
  )
}
