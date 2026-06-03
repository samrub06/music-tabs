'use client';

import type { ReactNode } from 'react';
import { VexChordDiagram } from './VexChordDiagram';
import {
  CHORD_PREVIEW_DIAGRAM_HEIGHT,
  CHORD_PREVIEW_DIAGRAM_OPTS,
  CHORD_PREVIEW_DIAGRAM_WIDTH,
  CHORD_PREVIEW_PIANO_ASPECT_CLASS,
  CHORD_PREVIEW_PIANO_CARD_CLASS,
} from './chordCardDimensions';
import type { ChordInstrument } from './InstrumentToggle';
import { PianoChordDiagram } from './PianoChordDiagram';
import type { VexChordDiagramData } from '@/types/chordVariants';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import { cn } from '@/lib/utils';

interface ChordPreviewCardProps {
  chordLabel: string;
  instrument?: ChordInstrument;
  diagram?: VexChordDiagramData | null;
  /** Container for imperative vexchords draw (DB fallback) */
  diagramContainerRef?: (el: HTMLDivElement | null) => void;
  onClick?: () => void;
  className?: string;
  footer?: ReactNode;
}

/**
 * Guitar: portrait cell with fretboard on top, label below.
 * Piano: wide rectangular cell matching 1900×800 keyboard SVGs.
 */
export function ChordPreviewCard({
  chordLabel,
  instrument = 'guitar',
  diagram,
  diagramContainerRef,
  onClick,
  className,
  footer,
}: ChordPreviewCardProps) {
  const showPiano = instrument === 'piano' && hasPianoChordDiagram(chordLabel);
  const hasDiagram =
    showPiano || diagram != null || diagramContainerRef != null;
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white',
        showPiano ? cn(CHORD_PREVIEW_PIANO_CARD_CLASS, 'items-stretch') : 'min-h-[11rem] w-full items-center',
        'shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-800',
        onClick &&
          'hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
        className
      )}
      aria-label={onClick ? `Diagramme ${chordLabel}` : undefined}
    >
      <div
        className={cn(
          'flex w-full min-h-0 items-center justify-center',
          showPiano
            ? cn(CHORD_PREVIEW_PIANO_ASPECT_CLASS, 'shrink-0 px-0.5 pt-1')
            : 'flex-1 px-1 pt-2'
        )}
      >
        {showPiano ? (
          <PianoChordDiagram chordSymbol={chordLabel} size="card" />
        ) : diagram ? (
          <VexChordDiagram chord={diagram} options={CHORD_PREVIEW_DIAGRAM_OPTS} />
        ) : hasDiagram ? (
          <div
            ref={diagramContainerRef}
            className="flex items-center justify-center"
            style={{
              width: CHORD_PREVIEW_DIAGRAM_WIDTH,
              height: CHORD_PREVIEW_DIAGRAM_HEIGHT,
            }}
          />
        ) : null}
      </div>
      <div
        className={cn(
          'w-full shrink-0 text-center',
          showPiano ? 'px-1 pb-1 pt-0' : 'px-1 pb-2.5 pt-0.5'
        )}
      >
        <div
          className={cn(
            'font-bold text-gray-900 dark:text-gray-100',
            showPiano ? 'text-xs' : 'text-sm'
          )}
        >
          {chordLabel}
        </div>
        {footer}
      </div>
    </Comp>
  );
}
