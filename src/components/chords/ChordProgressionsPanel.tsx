'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CHORD_PROGRESSION_PRESETS,
  type ChordProgressionPreset,
} from '@/data/chordProgressions'
import { ChordProgressionSongsDialog } from '@/components/chords/ChordProgressionSongsDialog'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ChordProgressionsPanelProps {
  className?: string
  /** Max presets to show in the compact panel. Defaults to 8. */
  limit?: number
  showSeeAll?: boolean
}

export function ChordProgressionsPanel({
  className,
  limit = 8,
  showSeeAll = true,
}: ChordProgressionsPanelProps) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<ChordProgressionPreset | null>(null)
  const presets = CHORD_PROGRESSION_PRESETS.slice(0, limit)

  return (
    <>
      <div className={cn('space-y-3', className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {t('chords.progressionsTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('chords.progressionsHint')}
            </p>
          </div>
          {showSeeAll && (
            <Link
              href="/chords/progressions"
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {t('chords.progressionsSeeAll')}
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelected(preset)}
              className="rounded-2xl border border-black/[0.06] bg-card px-3 py-3 text-left transition-colors hover:bg-muted/50 dark:border-white/[0.08]"
            >
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {preset.label}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {t(preset.nameKey)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <ChordProgressionSongsDialog
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
