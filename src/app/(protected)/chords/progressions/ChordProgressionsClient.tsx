'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CHORD_PROGRESSION_PRESETS,
  filterProgressionsByChord,
  getProgressionFilterChords,
  type ChordProgressionPreset,
} from '@/data/chordProgressions'
import { ChordProgressionSongsDialog } from '@/components/chords/ChordProgressionSongsDialog'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeftIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'

export default function ChordProgressionsClient() {
  const { t } = useLanguage()
  const [chordFilter, setChordFilter] = useState<string>('all')
  const [selected, setSelected] = useState<ChordProgressionPreset | null>(null)

  const filterChords = useMemo(() => getProgressionFilterChords(), [])
  const filteredPresets = useMemo(
    () => filterProgressionsByChord(chordFilter),
    [chordFilter]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link
            href="/chords"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            {t('chords.backToChords')}
          </Link>

          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t('chords.progressionsPageTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('chords.progressionsPageHint')}
            </p>
          </div>

          <div className="mb-6">
            <FilterChipRow title={t('chords.progressionsFilterByChord')}>
              <FilterChip
                active={chordFilter === 'all'}
                onClick={() => setChordFilter('all')}
              >
                {t('chords.progressionsFilterAll')}
              </FilterChip>
              {filterChords.map((chord) => (
                <FilterChip
                  key={chord}
                  active={chordFilter === chord}
                  onClick={() => setChordFilter(chord)}
                >
                  {chord}
                </FilterChip>
              ))}
            </FilterChipRow>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-card px-4 py-12 text-center dark:border-white/[0.08]">
              <MusicalNoteIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t('chords.progressionsFilterEmpty')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelected(preset)}
                  className="rounded-2xl border border-black/[0.06] bg-card px-4 py-4 text-left transition-colors hover:bg-muted/50 dark:border-white/[0.08]"
                >
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {preset.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(preset.nameKey)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preset.chords.map((chord) => (
                      <span
                        key={chord}
                        className={
                          chordFilter !== 'all' && chord === chordFilter
                            ? 'rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary'
                            : 'rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'
                        }
                      >
                        {chord}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {filteredPresets.length} / {CHORD_PROGRESSION_PRESETS.length}{' '}
            {t('chords.progressionsCount')}
          </p>
        </div>
      </div>

      <ChordProgressionSongsDialog
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
