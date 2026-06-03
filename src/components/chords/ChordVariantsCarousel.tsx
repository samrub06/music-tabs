'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { VexChordDiagram } from './VexChordDiagram';
import { CHORD_MODAL_DIAGRAM_OPTS } from './chordCardDimensions';
import type { ChordVariant } from '@/types/chordVariants';
import { cn } from '@/lib/utils';

export interface ChordVariantsCarouselProps {
  variants: ChordVariant[];
  /** Chord letter shown on diagram in compact mode (e.g. G, C) */
  chordSymbol?: string;
  /** Modal-style: diagram + counter only; full: includes label, description, thumbnails */
  variant?: 'compact' | 'full';
  /** Reset to first diagram when carousel mounts (e.g. modal open) */
  resetKey?: string | number | boolean;
  className?: string;
}

const SWIPE_THRESHOLD_PX = 40;

export function ChordVariantsCarousel({
  variants,
  chordSymbol = 'G',
  variant = 'full',
  resetKey,
  className,
}: ChordVariantsCarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = variants.length;
  const current = variants[index];
  const isCompact = variant === 'compact';

  useEffect(() => {
    setIndex(0);
  }, [resetKey]);

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;

    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) goPrev();
    else goNext();
  };

  if (!current) return null;

  const displayChord = isCompact
    ? { ...current.chord, name: chordSymbol }
    : current.chord;

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        isCompact ? 'items-start' : 'items-center',
        className
      )}
    >
      {isCompact ? (
        <div className="flex w-full flex-col items-start gap-2 pb-2 pt-0">
          <nav
            className="flex w-full items-center gap-0.5"
            aria-label="Navigation des diagrammes"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Diagramme précédent"
              className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-12"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <div
              className="flex min-w-0 flex-1 touch-pan-y items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <VexChordDiagram chord={displayChord} options={CHORD_MODAL_DIAGRAM_OPTS} />
            </div>
            <button
              type="button"
              onClick={goNext}
              aria-label="Diagramme suivant"
              className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-12"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </nav>
          <p className="w-full text-center text-sm font-medium text-muted-foreground">
            {index + 1} sur {total}
          </p>
          <p
            className="line-clamp-2 min-h-[2.5rem] w-full px-2 text-center text-xs leading-5 text-muted-foreground"
            title={current.description}
          >
            {current.description}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-6">
          <article className="flex flex-col items-center gap-4">
            <VexChordDiagram chord={current.chord} />
            <h3 className="text-center text-base font-semibold text-foreground">
              {current.label}
            </h3>
            <p className="max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
              {current.description}
            </p>
          </article>
          <nav
            className="flex w-full max-w-md items-center justify-between gap-4"
            aria-label="Navigation des diagrammes"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Diagramme précédent"
              className="flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-border bg-muted/80 px-4 text-2xl font-medium text-foreground transition-colors hover:bg-muted"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {index + 1} sur {total}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Diagramme suivant"
              className="flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-border bg-muted/80 px-4 text-2xl font-medium text-foreground transition-colors hover:bg-muted"
            >
              ›
            </button>
          </nav>
          {total > 12 && (
            <p className="text-xs text-muted-foreground">
              Numéros 1–{total} — faites défiler pour tout voir
            </p>
          )}
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1">
            {variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Diagramme ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'flex h-10 min-w-[40px] shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                  i === index
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
