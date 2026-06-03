'use client';

import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { VexChordDiagram } from './VexChordDiagram';
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

export function ChordVariantsCarousel({
  variants,
  chordSymbol = 'G',
  variant = 'full',
  resetKey,
  className,
}: ChordVariantsCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = variants.length;
  const current = variants[index];
  const isCompact = variant === 'compact';

  useEffect(() => {
    setIndex(0);
  }, [resetKey]);

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  if (!current) return null;

  const displayChord = isCompact
    ? { ...current.chord, name: chordSymbol }
    : current.chord;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {isCompact ? (
        <div className="flex w-full flex-col items-center gap-4 py-2">
          <VexChordDiagram chord={displayChord} />
          <nav
            className="flex w-full max-w-xs items-center justify-between gap-6 px-2"
            aria-label="Navigation des diagrammes"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Diagramme précédent"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <span className="text-sm text-muted-foreground">
              {index + 1} sur {total}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Diagramme suivant"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </nav>
          <p className="max-w-sm px-2 text-center text-xs leading-relaxed text-muted-foreground">
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
