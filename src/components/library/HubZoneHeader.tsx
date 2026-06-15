'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { HubZone } from '@/data/curatedPlaylists'
import { cn } from '@/lib/utils'

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
      <h2 className="text-lg font-bold tracking-tight sm:text-xl">
        {t(zoneTitleKey[zone])}
      </h2>
    </header>
  )
}
