'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { Song } from '@/types'
import {
  playBass,
  playBell,
  playDrums,
  playFlute,
  playGuitar,
  playHarp,
  playMarimba,
  playPiano,
  playSax,
  playSynth,
  playTrumpet,
  playUkulele,
  playViolin,
} from '@/lib/audio/instrumentSounds'

type InstrumentId =
  | 'guitar'
  | 'piano'
  | 'drums'
  | 'bass'
  | 'trumpet'
  | 'violin'
  | 'sax'
  | 'flute'
  | 'ukulele'
  | 'synth'
  | 'marimba'
  | 'bell'
  | 'harp'

const INSTRUMENTS: {
  id: InstrumentId
  emoji: string
  play: () => void
  tint: string
}[] = [
  { id: 'guitar', emoji: '🎸', play: playGuitar, tint: 'from-amber-500/20 to-amber-700/10' },
  { id: 'piano', emoji: '🎹', play: playPiano, tint: 'from-slate-400/20 to-slate-600/10' },
  { id: 'drums', emoji: '🥁', play: playDrums, tint: 'from-rose-500/20 to-rose-700/10' },
  { id: 'bass', emoji: '🪕', play: playBass, tint: 'from-orange-500/20 to-orange-800/10' },
  { id: 'trumpet', emoji: '🎺', play: playTrumpet, tint: 'from-yellow-400/25 to-amber-600/10' },
  { id: 'violin', emoji: '🎻', play: playViolin, tint: 'from-red-500/20 to-red-800/10' },
  { id: 'sax', emoji: '🎷', play: playSax, tint: 'from-amber-400/25 to-yellow-700/10' },
  { id: 'flute', emoji: '🪈', play: playFlute, tint: 'from-sky-400/20 to-sky-700/10' },
  { id: 'ukulele', emoji: '🏝️', play: playUkulele, tint: 'from-lime-400/20 to-green-700/10' },
  { id: 'synth', emoji: '🎧', play: playSynth, tint: 'from-violet-400/20 to-fuchsia-700/10' },
  { id: 'marimba', emoji: '🪘', play: playMarimba, tint: 'from-teal-400/20 to-teal-700/10' },
  { id: 'bell', emoji: '🔔', play: playBell, tint: 'from-yellow-300/25 to-amber-500/10' },
  { id: 'harp', emoji: '🎼', play: playHarp, tint: 'from-pink-400/20 to-rose-600/10' },
]

interface JamLabClientProps {
  suggestedSong: Song | null
}

export function JamLabClient({ suggestedSong }: JamLabClientProps) {
  const { t } = useLanguage()
  const [activeId, setActiveId] = useState<InstrumentId | null>(null)
  const [hits, setHits] = useState(0)

  const handlePlay = (id: InstrumentId, play: () => void) => {
    play()
    setActiveId(id)
    setHits((n) => n + 1)
    window.setTimeout(() => {
      setActiveId((current) => (current === id ? null : current))
    }, 280)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5 pb-8">
        <header className="space-y-2 text-center">
          <p className="text-3xl" aria-hidden>
            🎪
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('jamLab.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('jamLab.subtitle')}</p>
          {hits > 0 ? (
            <p className="text-xs font-medium text-primary">
              {t('jamLab.hitCount').replace('{count}', String(hits))}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {INSTRUMENTS.map((instrument) => {
            const label = t(`jamLab.instruments.${instrument.id}`)
            const isActive = activeId === instrument.id
            return (
              <button
                key={instrument.id}
                type="button"
                onClick={() => handlePlay(instrument.id, instrument.play)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-black/[0.06] bg-gradient-to-br p-2 transition-transform duration-150',
                  'dark:border-white/[0.08]',
                  instrument.tint,
                  isActive ? 'scale-95 ring-2 ring-primary/50' : 'active:scale-95 hover:brightness-110'
                )}
                aria-label={label}
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {instrument.emoji}
                </span>
                <span className="text-[11px] font-medium text-foreground/90">{label}</span>
              </button>
            )
          })}
        </div>

        <section
          className={cn(
            'space-y-3 rounded-2xl border border-black/[0.06] bg-muted/40 p-4',
            'dark:border-white/[0.08] dark:bg-white/[0.04]'
          )}
        >
          <p className="text-center text-sm font-medium text-foreground">
            {t('jamLab.stopNonsense')}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {t('jamLab.stopNonsenseHint')}
          </p>
          <Link
            href="/"
            className={cn(
              'flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold',
              'bg-primary text-primary-foreground transition-colors hover:bg-primary/90'
            )}
          >
            {t('jamLab.backToExplorer')}
          </Link>
        </section>

        {suggestedSong ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {t('jamLab.tryRealSong')}
            </h2>
            <Link
              href={`/song/${suggestedSong.id}`}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-card p-3 transition-colors',
                'hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
              )}
            >
              {suggestedSong.songImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={suggestedSong.songImageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                  🎵
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {suggestedSong.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {suggestedSong.author}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-primary">
                {t('jamLab.openSong')}
              </span>
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  )
}
