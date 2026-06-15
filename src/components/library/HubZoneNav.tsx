'use client'

import { useEffect, useState, type RefObject } from 'react'
import type { HubZone } from '@/data/curatedPlaylists'
import { useLanguage } from '@/context/LanguageContext'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'

export const HUB_ZONE_SECTION_IDS: Record<HubZone, string> = {
  songbook: 'hub-zone-songbook',
  israeli: 'hub-zone-israeli',
  international: 'hub-zone-international',
}

const HUB_ZONES: HubZone[] = ['songbook', 'israeli', 'international']

const zoneTitleKey: Record<HubZone, string> = {
  songbook: 'library.hubSongbookTab',
  israeli: 'library.hubIsraeliTab',
  international: 'library.hubInternationalTab',
}

interface HubZoneNavProps {
  scrollContainerRef: RefObject<HTMLElement | null>
  className?: string
}

export function HubZoneNav({ scrollContainerRef, className }: HubZoneNavProps) {
  const { t } = useLanguage()
  const [activeZone, setActiveZone] = useState<HubZone>('songbook')

  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root) return

    const sectionElements = HUB_ZONES.map((zone) =>
      document.getElementById(HUB_ZONE_SECTION_IDS[zone])
    ).filter((el): el is HTMLElement => el != null)

    if (sectionElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const topEntry = visible[0]
        if (!topEntry) return

        const zone = HUB_ZONES.find((z) => topEntry.target.id === HUB_ZONE_SECTION_IDS[z])
        if (zone) setActiveZone(zone)
      },
      {
        root,
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      }
    )

    sectionElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [scrollContainerRef])

  const scrollToZone = (zone: HubZone) => {
    const section = document.getElementById(HUB_ZONE_SECTION_IDS[zone])
    if (!section) return

    setActiveZone(zone)
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label={t('library.hubZoneNav')}
      className={cn('mb-3', className)}
    >
      <FilterChipRow>
        {HUB_ZONES.map((zone) => (
          <FilterChip
            key={zone}
            active={activeZone === zone}
            onClick={() => scrollToZone(zone)}
          >
            {t(zoneTitleKey[zone])}
          </FilterChip>
        ))}
      </FilterChipRow>
    </nav>
  )
}
