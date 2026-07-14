'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChordBox } from 'vexchords';
import { ChordPreviewCard } from '@/components/chords/ChordPreviewCard';
import {
  CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS,
  CHORD_PREVIEW_DIAGRAM_OPTS,
  CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS,
} from '@/components/chords/chordCardDimensions';
import {
  isDocumentDarkMode,
  withChordDiagramTheme,
} from '@/components/chords/chordDiagramTheme';
import type { ChordInstrument } from '@/components/chords/InstrumentToggle';
import { getChordVariantGroup } from '@/utils/chordVariantLookup';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import type { Chord, Song } from '@/types';
import { mapChordNicknameToDbName, normalizeChordNameForComparison } from '@/utils/chords';
import { extractAllChords } from '@/utils/structuredSong';
import { cn } from '@/lib/utils';

export interface ChordDiagramsGridProps {
  song: Song;
  onChordClick: (chord: string) => void;
  fontSize: number;
  selectedInstrument?: ChordInstrument;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[];
}

function normalizeChordName(chord: string): string {
  if (!chord) return '';
  let normalized = chord.trim().toUpperCase();
  const enharmonicMap: Record<string, string> = {
    'C#': 'DB',
    'D#': 'EB',
    'F#': 'GB',
    'G#': 'AB',
    'A#': 'BB',
  };
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat);
      break;
    }
  }
  return normalized;
}

function findChordInDatabase(songChordName: string, chords: Chord[]): Chord | null {
  if (!chords || chords.length === 0) return null;

  const dbName = mapChordNicknameToDbName(songChordName);
  const normalizedDbName = normalizeChordNameForComparison(dbName);

  for (const chord of chords) {
    const normalizedChordName = normalizeChordNameForComparison(chord.name);
    if (normalizedChordName === normalizedDbName) {
      return chord;
    }
  }

  const normalizedSongChord = normalizeChordNameForComparison(songChordName);
  for (const chord of chords) {
    const normalizedChordName = normalizeChordNameForComparison(chord.name);
    if (normalizedChordName === normalizedSongChord) {
      return chord;
    }
  }

  return null;
}

export function ChordDiagramsGrid({
  song,
  onChordClick,
  fontSize,
  selectedInstrument = 'guitar',
  knownChordIds = new Set(),
  chordNameToIdMap = new Map(),
  chords = [],
}: ChordDiagramsGridProps) {
  const allChords = extractAllChords(song);
  const chordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chordBoxesRef = useRef<Map<string, ChordBox>>(new Map());

  const unknownChords = useMemo(() => {
    return allChords.filter((songChordName: string) => {
      const normalized = normalizeChordName(songChordName);
      const chordId = chordNameToIdMap.get(normalized);
      const isKnown = chordId ? knownChordIds.has(chordId) : false;
      return !isKnown;
    });
  }, [allChords, chordNameToIdMap, knownChordIds]);

  const dbOnlyChords = useMemo(
    () =>
      unknownChords.filter(
        (songChordName: string) => getChordVariantGroup(songChordName) == null
      ),
    [unknownChords]
  );

  const useGuitarDiagrams = selectedInstrument !== 'piano';
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(isDocumentDarkMode());
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(isDocumentDarkMode()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!useGuitarDiagrams) return;
    if (chords.length === 0 || dbOnlyChords.length === 0) return;

    const timer = setTimeout(() => {
      dbOnlyChords.forEach((songChordName: string) => {
        const dbChord = findChordInDatabase(songChordName, chords);
        if (!dbChord) return;

        const container = chordRefs.current.get(songChordName);
        if (!container) return;

        container.innerHTML = '';
        chordBoxesRef.current.delete(songChordName);

        const chordBox = new ChordBox(container, withChordDiagramTheme(CHORD_PREVIEW_DIAGRAM_OPTS));
        chordBoxesRef.current.set(songChordName, chordBox);
        chordBox.draw({
          chord: dbChord.chordData.chord,
          position: dbChord.chordData.position,
          barres: dbChord.chordData.barres,
          tuning: dbChord.tuning,
        });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [dbOnlyChords, chords, useGuitarDiagrams, isDark]);

  return (
    <div>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:pb-0 lg:grid-cols-4">
        {unknownChords.map((songChordName: string) => {
          const variantGroup = getChordVariantGroup(songChordName);
          const previewVariant = variantGroup?.variants[0];
          const dbChord =
            variantGroup == null ? findChordInDatabase(songChordName, chords) : null;
          const hasPianoDiagram =
            selectedInstrument === 'piano' && hasPianoChordDiagram(songChordName);
          const hasDiagram =
            hasPianoDiagram ||
            (selectedInstrument !== 'piano' &&
              (previewVariant != null || dbChord != null));

          if (!hasDiagram) {
            return (
              <button
                key={songChordName}
                type="button"
                onClick={() => onChordClick(songChordName)}
                className={cn(
                  'flex min-h-[9.75rem] flex-col items-center justify-center rounded-lg border border-border bg-card px-2 shadow-sm hover:border-blue-400 hover:shadow-md dark:hover:border-blue-500 sm:w-full',
                  CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS
                )}
              >
                <span
                  className="text-center font-bold text-foreground"
                  style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
                  title={songChordName}
                >
                  {songChordName}
                </span>
              </button>
            );
          }

          const previewDiagram =
            useGuitarDiagrams && previewVariant
              ? {
                  ...previewVariant.chord,
                  name: variantGroup!.symbol,
                }
              : null;

          return (
            <ChordPreviewCard
              key={songChordName}
              chordLabel={songChordName}
              instrument={selectedInstrument}
              diagram={previewDiagram}
              diagramContainerRef={
                useGuitarDiagrams && !previewDiagram
                  ? (el) => {
                      if (el) chordRefs.current.set(songChordName, el);
                    }
                  : undefined
              }
              onClick={() => onChordClick(songChordName)}
              className={cn(
                'sm:w-full',
                selectedInstrument === 'piano'
                  ? CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS
                  : CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
