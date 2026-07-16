'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { Song } from '@/types'
import { triggerXpConfetti } from '@/utils/triggerXpConfetti'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  playBass,
  playBell,
  playDrums,
  playFlute,
  playGuitar,
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

type NoteParticle = {
  id: number
  char: string
  dx: number
  dy: number
  delayMs: number
  sizePx: number
  spinDeg: number
  colorClass: string
  durationMs: number
}

type RecordLogEntry = {
  score: number
  at: string
}

const ROUND_SECONDS = 10
const BANNER_BG = '#0B0B0F'
const TIMER_ORANGE = '#FF5A1F'
const TIMER_TRACK = '#3A3A42'

function JamRoundTimer({
  secondsLeft,
  totalSeconds,
  roundState,
  idleLabel,
  runningLabel,
  doneLabel,
}: {
  secondsLeft: number
  totalSeconds: number
  roundState: 'idle' | 'playing' | 'ended'
  idleLabel: string
  runningLabel: string
  doneLabel: string
}) {
  const size = 108
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress =
    roundState === 'idle'
      ? 1
      : roundState === 'ended'
        ? 0
        : Math.max(0, Math.min(1, secondsLeft / totalSeconds))
  const dashOffset = circumference * (1 - progress)
  const urgent = roundState === 'playing' && secondsLeft <= 3

  return (
    <div className="relative flex h-[108px] w-[108px] shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        {/* Segment ticks like Wolt */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const inner = radius - stroke / 2 - 1
          const outer = radius + stroke / 2 + 1
          const cx = size / 2
          const cy = size / 2
          return (
            <line
              key={i}
              x1={cx + Math.cos(angle) * inner}
              y1={cy + Math.sin(angle) * inner}
              x2={cx + Math.cos(angle) * outer}
              y2={cy + Math.sin(angle) * outer}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
            />
          )
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TIMER_TRACK}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? '#EF4444' : TIMER_ORANGE}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <p
          className={cn(
            'text-3xl font-bold tabular-nums leading-none text-white',
            urgent && 'animate-pulse text-red-400'
          )}
          aria-live="polite"
        >
          {secondsLeft}
        </p>
        <p className="mt-1 max-w-[4.5rem] text-[9px] font-medium leading-tight text-white/65">
          {roundState === 'idle'
            ? idleLabel
            : roundState === 'playing'
              ? runningLabel
              : doneLabel}
        </p>
      </div>
    </div>
  )
}
const BEST_SCORE_KEY = 'jam-lab-best-score'
const RECORD_LOG_KEY = 'jam-lab-record-log'
const MAX_LOG_ENTRIES = 12

const NOTE_CHARS = ['♪', '♫', '♩', '♬', '♮', '𝄞'] as const
const NOTE_COLORS = [
  'text-amber-500 dark:text-amber-300',
  'text-primary',
  'text-orange-500 dark:text-orange-300',
  'text-rose-500 dark:text-rose-300',
  'text-yellow-500 dark:text-yellow-300',
  'text-red-500 dark:text-red-400',
] as const

const INSTRUMENTS: {
  id: InstrumentId
  play: () => void
  accent: string
}[] = [
  { id: 'guitar', play: playGuitar, accent: '#E8A54B' },
  { id: 'piano', play: playPiano, accent: '#A8B0C0' },
  { id: 'drums', play: playDrums, accent: '#F07178' },
  { id: 'bass', play: playBass, accent: '#F0A060' },
  { id: 'trumpet', play: playTrumpet, accent: '#F5D76E' },
  { id: 'violin', play: playViolin, accent: '#E07070' },
  { id: 'sax', play: playSax, accent: '#D4956A' },
  { id: 'flute', play: playFlute, accent: '#7EB8D4' },
  { id: 'ukulele', play: playUkulele, accent: '#B8D46A' },
  { id: 'synth', play: playSynth, accent: '#FF5A1F' },
  { id: 'marimba', play: playMarimba, accent: '#5CBCB0' },
  { id: 'bell', play: playBell, accent: '#F0D78C' },
]

const PAD_BASE = '#14171F'
const GRID_LINE = '#0A0C10'
const GRID_FRAME = '#1C212B'

function loadBestScore(): number {
  try {
    const n = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function saveBestScore(score: number) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    // ignore
  }
}

function loadRecordLog(): RecordLogEntry[] {
  try {
    const raw = localStorage.getItem(RECORD_LOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e): e is RecordLogEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as RecordLogEntry).score === 'number' &&
          typeof (e as RecordLogEntry).at === 'string'
      )
      .slice(0, MAX_LOG_ENTRIES)
  } catch {
    return []
  }
}

function appendRecordLog(entry: RecordLogEntry): RecordLogEntry[] {
  const next = [entry, ...loadRecordLog()].slice(0, MAX_LOG_ENTRIES)
  try {
    localStorage.setItem(RECORD_LOG_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

function spawnNotesFromIcon(count: number): NoteParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const distance = 48 + Math.random() * 72
    return {
      id: 0,
      char: NOTE_CHARS[i % NOTE_CHARS.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delayMs: Math.floor(Math.random() * 80),
      sizePx: 14 + Math.floor(Math.random() * 14),
      spinDeg: (Math.random() - 0.5) * 260,
      colorClass: NOTE_COLORS[i % NOTE_COLORS.length],
      durationMs: 700 + Math.floor(Math.random() * 400),
    }
  })
}

function InstrumentPad({
  id,
  label,
  accent,
  play,
  disabled,
  onHit,
}: {
  id: InstrumentId
  label: string
  accent: string
  play: () => void
  disabled: boolean
  onHit: () => void
}) {
  const [notes, setNotes] = useState<NoteParticle[]>([])
  const [pulse, setPulse] = useState(false)
  const [shockwave, setShockwave] = useState(false)
  const noteIdRef = useRef(0)
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    if (disabled) return
    play()
    onHit()
    setPulse(true)
    setShockwave(true)
    window.setTimeout(() => setPulse(false), 220)
    window.setTimeout(() => setShockwave(false), 650)

    const burst = spawnNotesFromIcon(6).map((n) => ({
      ...n,
      id: ++noteIdRef.current,
    }))
    setNotes(burst)
    if (clearRef.current) clearTimeout(clearRef.current)
    clearRef.current = setTimeout(() => setNotes([]), 1100)
  }

  useEffect(() => {
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current)
    }
  }, [])

  return (
    <div className="relative aspect-square min-h-0">
      {notes.map((note) => (
        <span
          key={note.id}
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 select-none font-serif font-bold leading-none drop-shadow-md',
            'animate-explorer-note',
            note.colorClass
          )}
          style={
            {
              '--note-dx': `${note.dx}px`,
              '--note-dy': `${note.dy}px`,
              '--note-spin': `${note.spinDeg}deg`,
              fontSize: note.sizePx,
              animationDelay: `${note.delayMs}ms`,
              animationDuration: `${note.durationMs}ms`,
            } as CSSProperties
          }
          aria-hidden
        >
          {note.char}
        </span>
      ))}
      {shockwave ? (
        <span
          className="pointer-events-none absolute inset-1 z-[5] rounded-md border animate-explorer-shockwave"
          style={{ borderColor: `${accent}cc` }}
          aria-hidden
        />
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'group relative z-0 flex h-full w-full flex-col items-center justify-center gap-1.5 px-1.5 py-2 text-center',
          'transition-[transform,box-shadow,filter] duration-150 ease-out',
          'focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40',
          'disabled:cursor-not-allowed disabled:opacity-40',
          !disabled && 'active:scale-[0.97]',
          pulse && 'scale-[0.98]'
        )}
        style={
          {
            background: pulse
              ? `linear-gradient(160deg, ${accent}55 0%, ${PAD_BASE} 48%, #0E1118 100%)`
              : `linear-gradient(160deg, ${accent}28 0%, ${PAD_BASE} 42%, #0E1118 100%)`,
            boxShadow: pulse
              ? `inset 0 0 0 1px ${accent}99, 0 0 18px ${accent}33`
              : 'inset 0 1px 0 rgba(255,255,255,0.07)',
          } as CSSProperties
        }
        data-instrument={id}
      >
        <span
          className="h-1 w-5 rounded-full opacity-90 transition-transform duration-150 group-hover:scale-110"
          style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}88` }}
          aria-hidden
        />
        <span className="text-[10px] font-semibold tracking-wide text-white/90 sm:text-[11px]">
          {label}
        </span>
      </button>
    </div>
  )
}

function JamStartHint({ visible }: { visible: boolean }) {
  const { t } = useLanguage()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!visible) {
      setShown(false)
      return
    }
    const start = window.setTimeout(() => setShown(true), 250)
    const hide = window.setTimeout(() => setShown(false), 7000)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(hide)
    }
  }, [visible])

  if (!visible || !shown) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4',
        'animate-swipe-hint-fade'
      )}
    >
      <div
        className={cn(
          'inline-flex max-w-[min(100%,17rem)] items-center gap-3 rounded-2xl px-4 py-3',
          'border border-white/12 bg-[#12151C]/92 text-white shadow-xl backdrop-blur-md',
          'ring-1 ring-black/40'
        )}
        role="status"
      >
        <span
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${TIMER_ORANGE}22` }}
        >
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: TIMER_ORANGE }}
            aria-hidden
          />
          <FingerTapIcon
            className="relative h-5 w-5"
            style={{ color: TIMER_ORANGE }}
          />
        </span>
        <p className="min-w-0 text-[13px] font-semibold leading-snug tracking-tight text-white">
          {t('jamLab.timerIdle')}
        </p>
      </div>
    </div>
  )
}

function FingerTapIcon({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.29.29.68.45 1.09.45h6.85c.86 0 1.57-.64 1.68-1.48l.72-5.45a1.7 1.7 0 0 0-.89-1.71z" />
    </svg>
  )
}

interface JamLabClientProps {
  suggestedSong: Song | null
}

export function JamLabClient({ suggestedSong }: JamLabClientProps) {
  const { t, language } = useLanguage()
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [recordLog, setRecordLog] = useState<RecordLogEntry[]>([])
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [roundState, setRoundState] = useState<'idle' | 'playing' | 'ended'>('idle')
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [roundKey, setRoundKey] = useState(0)

  const scoreRef = useRef(0)
  const bestRef = useRef(0)
  const roundStateRef = useRef<'idle' | 'playing' | 'ended'>('idle')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endedRef = useRef(false)

  useEffect(() => {
    const best = loadBestScore()
    setBestScore(best)
    bestRef.current = best
    setRecordLog(loadRecordLog())
    setMounted(true)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const finishRound = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    roundStateRef.current = 'ended'
    setRoundState('ended')
    setSecondsLeft(0)

    const finalScore = scoreRef.current
    triggerXpConfetti('levelUp')

    if (finalScore > bestRef.current) {
      saveBestScore(finalScore)
      bestRef.current = finalScore
      setBestScore(finalScore)
      setIsNewRecord(true)
      const entry = { score: finalScore, at: new Date().toISOString() }
      setRecordLog(appendRecordLog(entry))
      window.setTimeout(() => triggerXpConfetti('levelUp'), 280)
    } else {
      setIsNewRecord(false)
    }
  }, [])

  const startRoundIfNeeded = useCallback(() => {
    if (roundStateRef.current !== 'idle') return
    endedRef.current = false
    roundStateRef.current = 'playing'
    setIsNewRecord(false)
    setSecondsLeft(ROUND_SECONDS)
    setRoundState('playing')
    setRoundKey((k) => k + 1)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.setTimeout(() => finishRound(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [finishRound])

  const handleHit = () => {
    if (roundStateRef.current === 'ended') return
    startRoundIfNeeded()
    setScore((n) => {
      const next = n + 1
      scoreRef.current = next
      return next
    })
  }

  const playAgain = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    endedRef.current = false
    scoreRef.current = 0
    roundStateRef.current = 'idle'
    setScore(0)
    setSecondsLeft(ROUND_SECONDS)
    setRoundState('idle')
    setIsNewRecord(false)
  }

  const formatRecordDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : language === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-5 pb-8">
        <header className="space-y-1.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('jamLab.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('jamLab.subtitle')}</p>
        </header>

        {/* Score board — game banner + Wolt-style circular timer */}
        <section
          className={cn(
            'relative overflow-hidden rounded-2xl border border-white/10 shadow-sm'
          )}
          style={
            {
              backgroundColor: BANNER_BG,
              '--promo-snake-color': TIMER_ORANGE,
            } as CSSProperties
          }
        >
          {roundState === 'playing' || roundState === 'ended' ? (
            <span
              key={roundKey}
              aria-hidden
              className={cn(
                'promo-snake-border pointer-events-none absolute inset-0 z-20 rounded-2xl',
                roundState === 'ended' && 'promo-snake-border-filled'
              )}
            />
          ) : null}

          <div className="relative z-10 flex min-h-[7.5rem] items-center justify-between gap-2 p-4 sm:min-h-[8.5rem] sm:gap-3 sm:p-5">
            <div className="relative z-10 min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <MusicalNoteIcon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">
                  {t('jamLab.scoreLabel')}
                </p>
              </div>
              <p
                className="text-5xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-6xl"
                aria-live="polite"
              >
                {mounted ? score : 0}
              </p>
              <p className="text-xs font-medium text-white/60">
                {t('jamLab.bestScore').replace('{count}', String(mounted ? bestScore : 0))}
              </p>
            </div>

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
              aria-hidden
            >
              <Image
                src="/game.png"
                alt=""
                width={160}
                height={160}
                className="h-28 w-28 object-contain sm:h-32 sm:w-32"
                priority={false}
              />
            </div>

            <div className="relative z-10 flex shrink-0 justify-end">
              <JamRoundTimer
                secondsLeft={secondsLeft}
                totalSeconds={ROUND_SECONDS}
                roundState={roundState}
                idleLabel={t('jamLab.timerReady')}
                runningLabel={t('jamLab.timerRunning')}
                doneLabel={t('jamLab.timerDone')}
              />
            </div>
          </div>
        </section>

        <Dialog
          open={roundState === 'ended'}
          onOpenChange={(open) => {
            if (!open) playAgain()
          }}
        >
          <DialogContent
            showCloseButton={false}
            className={cn(
              'max-w-sm rounded-2xl border p-5 text-center sm:rounded-2xl',
              isNewRecord
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-black/[0.06] bg-background dark:border-white/[0.08]'
            )}
          >
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="text-base font-semibold text-foreground sm:text-lg">
                {isNewRecord
                  ? t('jamLab.newRecordTitle')
                  : t('jamLab.roundOverTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isNewRecord
                  ? t('jamLab.newRecordBody').replace('{count}', String(score))
                  : t('jamLab.roundOverBody').replace('{count}', String(score))}
              </DialogDescription>
            </DialogHeader>
            {isNewRecord && (
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                {t('jamLab.guinnessBadge')}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t('jamLab.backToExplorer')}
              </Link>
              <button
                type="button"
                onClick={playAgain}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-muted/50 px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {t('jamLab.tryAgain')}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {t('jamLab.instrumentsTitle')}
          </h2>

          {/* Modern synth pad matrix */}
          <div
            className="relative overflow-hidden rounded-2xl p-1 shadow-lg ring-1 ring-black/20"
            style={{ backgroundColor: GRID_FRAME }}
          >
            <JamStartHint visible={roundState === 'idle'} />
            <div
              className="grid grid-cols-4 gap-px overflow-hidden rounded-xl"
              style={{ backgroundColor: GRID_LINE }}
            >
              {INSTRUMENTS.map((instrument) => (
                <InstrumentPad
                  key={instrument.id}
                  id={instrument.id}
                  label={t(`jamLab.instruments.${instrument.id}`)}
                  accent={instrument.accent}
                  play={instrument.play}
                  disabled={roundState === 'ended'}
                  onHit={handleHit}
                />
              ))}
              {Array.from({ length: (4 - (INSTRUMENTS.length % 4)) % 4 }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square"
                  style={{
                    background:
                      'linear-gradient(160deg, #1A1E28 0%, #0E1118 100%)',
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </section>

        {/* Guinness record log */}
        {mounted && recordLog.length > 0 && (
          <section
            className={cn(
              'space-y-2.5 rounded-2xl border border-black/[0.06] bg-card/60 p-4',
              'dark:border-white/[0.08] dark:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>
                🏆
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                {t('jamLab.recordLogTitle')}
              </h2>
            </div>
            <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
              {recordLog.map((entry, i) => (
                <li
                  key={`${entry.at}-${entry.score}-${i}`}
                  className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="font-semibold tabular-nums text-foreground">
                    {t('jamLab.recordLogEntry').replace('{count}', String(entry.score))}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatRecordDate(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
