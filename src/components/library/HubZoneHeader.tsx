'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { HubZone } from '@/data/curatedPlaylists'
import { cn } from '@/lib/utils'
import { ExploreHubCta } from '@/components/library/ExploreHubCta'

const zoneTitleKey: Record<HubZone, string> = {
  songbook: 'library.hubSongbookTitle',
  israeli: 'library.hubIsraeliTitle',
  international: 'library.hubInternationalTitle',
}

interface HubZoneHeaderProps {
  zone: HubZone
  className?: string
}

export function HubZoneHeader({ zone, className }: HubZoneHeaderProps) {
  const { t } = useLanguage()

  return (
    <header className={cn('mb-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            {t(zoneTitleKey[zone])}
          </h2>
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
