'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { HubZone } from '@/data/curatedPlaylists'
import { cn } from '@/lib/utils'
import { ExploreHubCta } from '@/components/library/ExploreHubCta'

const zoneConfig: Record<
  HubZone,
  {
    titleKey: string
    descriptionKey: string
    accentClass: string
    borderClass: string
  }
> = {
  songbook: {
    titleKey: 'library.hubSongbookTitle',
    descriptionKey: 'library.hubSongbookDescription',
    accentClass: 'text-teal-700 dark:text-teal-400',
    borderClass: 'border-teal-500/30',
  },
  israeli: {
    titleKey: 'library.hubIsraeliTitle',
    descriptionKey: 'library.hubIsraeliDescription',
    accentClass: 'text-sky-700 dark:text-sky-400',
    borderClass: 'border-sky-500/30',
  },
  international: {
    titleKey: 'library.hubInternationalTitle',
    descriptionKey: 'library.hubInternationalDescription',
    accentClass: 'text-violet-700 dark:text-violet-400',
    borderClass: 'border-violet-500/30',
  },
}

interface HubZoneHeaderProps {
  zone: HubZone
  className?: string
}

export function HubZoneHeader({ zone, className }: HubZoneHeaderProps) {
  const { t } = useLanguage()
  const config = zoneConfig[zone]

  return (
    <header
      className={cn(
        'mb-4 border-s-4 ps-3 sm:ps-4',
        config.borderClass,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              'text-lg font-bold tracking-tight sm:text-xl',
              config.accentClass
            )}
          >
            {t(config.titleKey)}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t(config.descriptionKey)}</p>
        </div>
        {zone === 'international' && (
          <ExploreHubCta variant="inline" className="mt-0.5 hidden sm:inline-flex" />
        )}
      </div>
      {zone === 'international' && (
        <div className="mt-3 sm:hidden">
          <ExploreHubCta variant="banner" className="mb-0" />
        </div>
      )}
    </header>
  )
}
