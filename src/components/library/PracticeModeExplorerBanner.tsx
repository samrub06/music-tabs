'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { PRACTICE_DEMO_SONG_HREF } from '@/data/practiceDemoSong'

/** Parchment tone sampled from media/pratice.png */
const BANNER_BG = '#D0C8B0'
const BANNER_INK = '#2A2418'

/**
 * Explorer promo: Practice mode — Try it opens Beau-Papa (Vianney).
 */
export function PracticeModeExplorerBanner() {
  const { t } = useLanguage()

  return (
    <section className="mb-6">
      <div
        className="relative min-h-[8.5rem] w-full overflow-hidden rounded-xl sm:min-h-[9.5rem]"
        style={{ backgroundColor: BANNER_BG }}
      >
        <span
          className="absolute end-2.5 top-2.5 z-20 rounded-full border border-black/15 bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2.5 sm:text-[11px]"
          style={{ color: BANNER_INK }}
        >
          {t('library.practiceNewBadge')}
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 end-0 w-1/2 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -bottom-10 -end-4 sm:-bottom-14 sm:-end-2">
            <Image
              src="/pratice.png"
              alt=""
              width={512}
              height={512}
              className="h-44 w-auto max-w-none rotate-[18deg] object-contain drop-shadow-md sm:h-56"
            />
          </div>
        </div>

        <div className="relative z-10 flex min-h-[8.5rem] flex-col items-start justify-between p-5 sm:min-h-[9.5rem] sm:p-6">
          <div className="flex min-w-0 max-w-[50%] flex-col items-start pr-2 sm:max-w-[52%]">
            <h2
              className="text-base font-semibold tracking-tight sm:text-lg"
              style={{ color: BANNER_INK }}
            >
              {t('library.practiceBannerTitle')}
            </h2>
            <p
              className="mt-1.5 text-[11px] font-medium leading-relaxed opacity-80 min-[400px]:text-xs sm:mt-2 sm:max-w-sm sm:text-sm"
              style={{ color: BANNER_INK }}
            >
              {t('library.practiceBannerDescription')}
            </p>
          </div>

          <div className="mt-3 shrink-0 sm:mt-4">
            <Link
              href={PRACTICE_DEMO_SONG_HREF}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition hover:brightness-110 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
              style={{ backgroundColor: BANNER_INK, color: BANNER_BG }}
            >
              <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              <span>{t('library.practiceTryIt')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
