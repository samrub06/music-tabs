'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/types'
import type { ChordProgressionPreset } from '@/data/chordProgressions'
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

interface ChordProgressionSongsDialogProps {
  selected: ChordProgressionPreset | null
  onClose: () => void
}

export function ChordProgressionSongsDialog({
  selected,
  onClose,
}: ChordProgressionSongsDialogProps) {
  const { t } = useLanguage()
  const router = useRouter()
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
    <Dialog
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) onClose()
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
                      onClose()
                      router.push(`/song/${song.id}`)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {song.title}
                      </p>
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
  )
}
