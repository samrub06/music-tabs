'use client';

import type { ReactNode } from 'react';
import { VexChordDiagram } from './VexChordDiagram';
import {
  CHORD_PREVIEW_CARD_WIDTH_CLASS,
  CHORD_PREVIEW_DIAGRAM_HEIGHT,
  CHORD_PREVIEW_DIAGRAM_OPTS,
  CHORD_PREVIEW_DIAGRAM_WIDTH,
} from './chordCardDimensions';
import type { VexChordDiagramData } from '@/types/chordVariants';
import { cn } from '@/lib/utils';

interface ChordPreviewCardProps {
  chordLabel: string;
  diagram?: VexChordDiagramData | null;
  /** Container for imperative vexchords draw (DB fallback) */
  diagramContainerRef?: (el: HTMLDivElement | null) => void;
  onClick?: () => void;
  className?: string;
  footer?: ReactNode;
}

/**
 * Portrait chord cell: diagram on top, label at bottom (matches song “Accords utilisés” layout).
 */
export function ChordPreviewCard({
  chordLabel,
  diagram,
  diagramContainerRef,
  onClick,
  className,
  footer,
}: ChordPreviewCardProps) {
  const hasDiagram = diagram != null || diagramContainerRef != null;
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        CHORD_PREVIEW_CARD_WIDTH_CLASS,
        'flex min-h-[9.75rem] shrink-0 flex-col items-center rounded-lg border border-gray-200 bg-white sm:w-full',
        'shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-800',
        onClick &&
          'hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
        className
      )}
      aria-label={onClick ? `Diagramme ${chordLabel}` : undefined}
    >
      <div className="flex w-full flex-1 items-center justify-center px-1 pt-2">
        {diagram ? (
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
      <div className="w-full px-1 pb-2.5 pt-0.5 text-center">
        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{chordLabel}</div>
        {footer}
      </div>
    </Comp>
  );
}
