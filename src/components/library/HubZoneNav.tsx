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

const EXPLORER_TOP_ID = 'explorer-top'

const HUB_ZONES: HubZone[] = ['israeli', 'songbook', 'international']

const zoneTitleKey: Record<HubZone, string> = {
  songbook: 'library.hubSongbookTab',
  israeli: 'library.hubIsraeliTab',
  international: 'library.hubInternationalTab',
}

type ActiveChip = 'all' | HubZone

interface HubZoneNavProps {
  scrollContainerRef: RefObject<HTMLElement | null>
  className?: string
}

export function HubZoneNav({ scrollContainerRef, className }: HubZoneNavProps) {
  const { t } = useLanguage()
  const [activeChip, setActiveChip] = useState<ActiveChip>('all')

  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root) return

    const sectionElements = HUB_ZONES.map((zone) =>
      document.getElementById(HUB_ZONE_SECTION_IDS[zone])
    ).filter((el): el is HTMLElement => el != null)

    if (sectionElements.length === 0) return

    const firstZone = sectionElements[0]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const topEntry = visible[0]
        if (!topEntry) {
          // Above first zone → Tout
          if (firstZone && root.scrollTop < firstZone.offsetTop - 40) {
            setActiveChip('all')
          }
          return
        }

        const zone = HUB_ZONES.find((z) => topEntry.target.id === HUB_ZONE_SECTION_IDS[z])
        if (zone) setActiveChip(zone)
      },
      {
        root,
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      }
    )

    sectionElements.forEach((el) => observer.observe(el))

    const onScroll = () => {
      if (!firstZone) return
      if (root.scrollTop < firstZone.offsetTop - 48) {
        setActiveChip('all')
      }
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', onScroll)
    }
  }, [scrollContainerRef])

  const scrollToTop = () => {
    const top = document.getElementById(EXPLORER_TOP_ID)
    setActiveChip('all')
    if (top) {
      top.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToZone = (zone: HubZone) => {
    const section = document.getElementById(HUB_ZONE_SECTION_IDS[zone])
    if (!section) return

    setActiveChip(zone)
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label={t('library.hubZoneNav')}
      className={cn('mb-3', className)}
    >
      <FilterChipRow>
        <FilterChip active={activeChip === 'all'} onClick={scrollToTop}>
          {t('library.hubAllTab')}
        </FilterChip>
        {HUB_ZONES.map((zone) => (
          <FilterChip
            key={zone}
            active={activeChip === zone}
            onClick={() => scrollToZone(zone)}
          >
            {t(zoneTitleKey[zone])}
          </FilterChip>
        ))}
      </FilterChipRow>
    </nav>
  )
}
