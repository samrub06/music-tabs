'use client'

import { ChordHighway } from '@/components/practice/ChordHighway'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { SongLine, StructuredSong } from '@/types'
import { buildSpacedChordLine } from '@/utils/chordLineBuilder'
import { containsHebrew, getTextDirection } from '@/utils/rtl'
import { getSongChordFontFamily, getSongLyricsFontFamily } from '@/utils/songFonts'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useMemo } from 'react'

const CHORD_TOKEN_PATTERN =
  /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g

export interface PracticeLine {
  lyrics?: string
  chords?: string
  chordSymbols: string[]
}

export function extractPracticeLines(
  song: Pick<StructuredSong, 'sections'> | null | undefined
): PracticeLine[] {
  if (!song?.sections?.length) return []

  const lines: PracticeLine[] = []

  for (const section of song.sections) {
    if (section?.name === 'Version Description') continue
    if (!Array.isArray(section?.lines)) continue

    for (const line of section.lines as SongLine[]) {
      lines.push(toPracticeLine(line))
    }
  }

  return lines
}

function toPracticeLine(line: SongLine): PracticeLine {
  const lyrics = line.lyrics?.trim() ? line.lyrics : undefined
  let chords: string | undefined
  let chordSymbols: string[] = []

  if (line.chords && line.chords.length > 0) {
    chordSymbols = line.chords.map((c) => c.chord)
    chords = buildSpacedChordLine(line.chords, line.lyrics ?? '').trimEnd()
  } else if (line.chord_line) {
    chords = line.chord_line
    chordSymbols = extractChordSymbolsFromText(line.chord_line)
  }

  return { lyrics, chords, chordSymbols }
}

function extractChordSymbolsFromText(text: string): string[] {
  const matches = text.match(CHORD_TOKEN_PATTERN) || []
  return matches
}

interface LandscapePracticeViewProps {
  songTitle: string
  lines: PracticeLine[]
  activeLineIndex: number
  lineCount: number
  isPlaying: boolean
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
  onExit: () => void
}

/**
 * Fullscreen landscape practice overlay: chord highway + current line + controls.
 */
export function LandscapePracticeView({
  songTitle,
  lines,
  activeLineIndex,
  lineCount,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
  onExit,
}: LandscapePracticeViewProps) {
  const { t } = useLanguage()

  useEffect(() => {
    document.body.classList.add('practice-landscape')
    return () => {
      document.body.classList.remove('practice-landscape')
    }
  }, [])

  const current = lines[activeLineIndex]
  const lyrics = current?.lyrics ?? ''
  const chords = current?.chords ?? ''
  const textSample = lyrics || chords || songTitle
  const dir = getTextDirection(textSample)
  const isHebrew = containsHebrew(textSample)

  const { highwayChords, highwayActiveIndex } = useMemo(() => {
    const symbols: string[] = []
    let activeChordStart = 0

    for (let i = 0; i < lines.length; i++) {
      const lineSymbols = lines[i]?.chordSymbols ?? []
      if (i === activeLineIndex) {
        activeChordStart = symbols.length
      }
      symbols.push(...lineSymbols)
    }

    // Prefer first chord of the active line; if the line has none, point at next upcoming.
    let activeIdx = activeChordStart
    if ((lines[activeLineIndex]?.chordSymbols.length ?? 0) === 0) {
      const nextWithChords = symbols.length > activeChordStart ? activeChordStart : Math.max(0, symbols.length - 1)
      activeIdx = nextWithChords
    }

    return { highwayChords: symbols, highwayActiveIndex: activeIdx }
  }, [lines, activeLineIndex])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-label={t('songContent.landscapePractice.title')}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{songTitle}</p>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {activeLineIndex + 1} / {lineCount}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t('songContent.practiceExit')}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Top ~40%: chord highway */}
      <div className="h-[40%] min-h-0 shrink-0 p-3 pb-2">
        <ChordHighway
          chords={highwayChords}
          activeIndex={highwayActiveIndex}
          className="h-full"
        />
      </div>

      {/* Middle: current line */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-2">
        {chords ? (
          <p
            dir="ltr"
            className="whitespace-pre-wrap text-center text-2xl font-semibold tracking-wide text-blue-600 dark:text-blue-400 sm:text-3xl"
            style={{ fontFamily: getSongChordFontFamily() }}
          >
            {chords}
          </p>
        ) : null}
        {lyrics ? (
          <p
            dir={dir}
            className="max-w-4xl text-center text-2xl font-medium leading-snug text-foreground sm:text-4xl"
            style={{ fontFamily: getSongLyricsFontFamily(isHebrew) }}
          >
            {lyrics}
          </p>
        ) : !chords ? (
          <p className="text-sm text-muted-foreground">
            {t('songContent.landscapePractice.emptyLine')}
          </p>
        ) : null}
      </div>

      {/* Bottom: practice controls */}
      <div
        className={cn(
          'shrink-0 border-t border-border px-4 py-3',
          'bg-background/95 backdrop-blur-xl',
          'safe-area-pb'
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeLineIndex <= 0}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-40"
            aria-label={t('songContent.practicePrev')}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"
            aria-label={
              isPlaying ? t('songContent.practicePause') : t('songContent.practicePlay')
            }
          >
            {isPlaying ? (
              <PauseIcon className="h-7 w-7" />
            ) : (
              <PlayIcon className="h-7 w-7" />
            )}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={activeLineIndex >= lineCount - 1}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-40"
            aria-label={t('songContent.practiceNext')}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
