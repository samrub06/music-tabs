'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { VexChordDiagram } from './VexChordDiagram';
import { CHORD_MODAL_DIAGRAM_OPTS } from './chordCardDimensions';
import type { ChordVariant } from '@/types/chordVariants';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

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

const SWIPE_THRESHOLD_PX = 32;

type SlideDirection = 'next' | 'prev';

function slideEnterClass(direction: SlideDirection, size: 'sm' | 'md') {
  return cn(
    'animate-in fade-in duration-200 motion-reduce:animate-none',
    direction === 'next'
      ? size === 'md'
        ? 'slide-in-from-right-8'
        : 'slide-in-from-right-4'
      : size === 'md'
        ? 'slide-in-from-left-8'
        : 'slide-in-from-left-4'
  );
}

function useHorizontalSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const reset = () => {
    touchStart.current = null;
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;

    const touch = event.changedTouches[0];
    reset();
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX > 0) onSwipeRight();
    else onSwipeLeft();
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: reset,
  };
}

export function ChordVariantsCarousel({
  variants,
  chordSymbol = 'G',
  variant = 'full',
  resetKey,
  className,
}: ChordVariantsCarouselProps) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('next');
  const total = variants.length;
  const current = variants[index];
  const isCompact = variant === 'compact';

  useEffect(() => {
    setIndex(0);
    setSlideDirection('next');
  }, [resetKey]);

  const goPrev = () => {
    setSlideDirection('prev');
    setIndex((i) => (i - 1 + total) % total);
  };
  const goNext = () => {
    setSlideDirection('next');
    setIndex((i) => (i + 1) % total);
  };
  const swipeHandlers = useHorizontalSwipe(goNext, goPrev);

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
            className="flex w-full touch-pan-y select-none items-center gap-0.5"
            aria-label="Navigation des diagrammes"
            {...swipeHandlers}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Diagramme précédent"
              className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-12"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <div className="relative min-h-[12.5rem] min-w-0 flex-1 overflow-hidden py-2">
              <div
                key={index}
                className={cn(
                  'flex items-center justify-center',
                  slideEnterClass(slideDirection, 'md')
                )}
              >
                <VexChordDiagram chord={displayChord} options={CHORD_MODAL_DIAGRAM_OPTS} />
              </div>
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
            {t('chordCarousel.PAGE_COUNTER').replace('{current}', String(index + 1)).replace('{total}', String(total))}
          </p>
          <p
            key={`desc-${index}`}
            className={cn(
              'line-clamp-2 min-h-[2.5rem] w-full px-2 text-center text-xs leading-5 text-muted-foreground',
              slideEnterClass(slideDirection, 'sm')
            )}
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
              {t('chordCarousel.PAGE_COUNTER').replace('{current}', String(index + 1)).replace('{total}', String(total))}
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
              {t('chordCarousel.SCROLL_HINT').replace('{total}', String(total))}
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
