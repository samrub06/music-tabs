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
  /** When set, shows a See all / Show less control next to the title. */
  seeAll?: boolean
  onSeeAllToggle?: () => void
}

export function HubZoneHeader({
  zone,
  className,
  seeAll,
  onSeeAllToggle,
}: HubZoneHeaderProps) {
  const { t } = useLanguage()

  return (
    <header
      className={cn(
        'mb-3 flex items-baseline justify-between gap-3',
        className
      )}
    >
      <h2 className="min-w-0 text-lg font-bold tracking-tight sm:text-xl">
        {t(zoneTitleKey[zone])}
      </h2>
      {onSeeAllToggle ? (
        <button
          type="button"
          onClick={onSeeAllToggle}
          className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
        >
          {seeAll ? t('folders.showLess') : t('library.viewAll')}
        </button>
      ) : null}
    </header>
  )
}
