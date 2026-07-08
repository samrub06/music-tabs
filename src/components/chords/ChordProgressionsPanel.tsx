'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/types'
import { findSongsByChordProgressionAction } from '@/app/(protected)/chords/actions'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export type ChordProgressionPreset = {
  id: string
  label: string
  chords: string[]
  nameKey: string
}

export const CHORD_PROGRESSION_PRESETS: ChordProgressionPreset[] = [
  {
    id: 'g-c-d',
    label: 'G · C · D',
    chords: ['G', 'C', 'D'],
    nameKey: 'chords.progressionPopRock',
  },
  {
    id: 'a-e-d',
    label: 'A · E · D',
    chords: ['A', 'E', 'D'],
    nameKey: 'chords.progressionClassicRock',
  },
  {
    id: 'a-e-d-g',
    label: 'A · E · D · G',
    chords: ['A', 'E', 'D', 'G'],
    nameKey: 'chords.progressionFourChordsMajor',
  },
  {
    id: 'c-g-am-f',
    label: 'C · G · Am · F',
    chords: ['C', 'G', 'Am', 'F'],
    nameKey: 'chords.progressionPop',
  },
  {
    id: 'am-f-c-g',
    label: 'Am · F · C · G',
    chords: ['Am', 'F', 'C', 'G'],
    nameKey: 'chords.progressionAxis',
  },
  {
    id: 'em-c-g-d',
    label: 'Em · C · G · D',
    chords: ['Em', 'C', 'G', 'D'],
    nameKey: 'chords.progressionFolk',
  },
  {
    id: 'd-a-bm-g',
    label: 'D · A · Bm · G',
    chords: ['D', 'A', 'Bm', 'G'],
    nameKey: 'chords.progressionBallad',
  },
  {
    id: 'g-d-em-c',
    label: 'G · D · Em · C',
    chords: ['G', 'D', 'Em', 'C'],
    nameKey: 'chords.progressionCampfire',
  },
]

interface ChordProgressionsPanelProps {
  className?: string
}

export function ChordProgressionsPanel({ className }: ChordProgressionsPanelProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [selected, setSelected] = useState<ChordProgressionPreset | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!selected) {
      setSongs([])
      return
    }

    let cancelled = false
    startTransition(async () => {
      try {
        const results = await findSongsByChordProgressionAction({
          chords: selected.chords,
          limit: 30,
        })
        if (!cancelled) setSongs(results)
      } catch (error) {
        console.error(error)
        if (!cancelled) setSongs([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [selected])

  return (
    <>
      <div className={cn('space-y-3', className)}>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t('chords.progressionsTitle')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('chords.progressionsHint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CHORD_PROGRESSION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelected(preset)}
              className="rounded-2xl border border-black/[0.06] bg-card px-3 py-3 text-left transition-colors hover:bg-muted/50 dark:border-white/[0.08]"
            >
              <p className="text-sm font-semibold tabular-nums text-foreground">{preset.label}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{t(preset.nameKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent
          className="flex max-h-[85vh] w-[min(100%-2rem,28rem)] max-w-md flex-col gap-0 overflow-hidden rounded-2xl p-0"
          closeButtonClassName="right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full opacity-100 hover:bg-muted"
          closeIconClassName="h-6 w-6"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 pb-3 pt-5 pe-14">
            <DialogTitle className="text-lg">{selected?.label}</DialogTitle>
            <DialogDescription>
              {selected ? t(selected.nameKey) : ''}
              {' · '}
              {t('chords.progressionsMatchHint')}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {pending ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </p>
            ) : songs.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <MusicalNoteIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('chords.progressionsNoSongs')}
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {songs.map((song) => (
                  <li key={song.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(null)
                        router.push(`/song/${song.id}`)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{song.author}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
