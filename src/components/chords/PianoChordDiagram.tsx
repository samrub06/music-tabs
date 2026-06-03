'use client';

import { getPianoChordSvgUrl } from '@/utils/pianoChordAssets';
import { cn } from '@/lib/utils';

interface PianoChordDiagramProps {
  chordSymbol: string;
  className?: string;
  /** Larger view in modals */
  size?: 'card' | 'modal';
}

export function PianoChordDiagram({
  chordSymbol,
  className,
  size = 'card',
}: PianoChordDiagramProps) {
  const src = getPianoChordSvgUrl(chordSymbol);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${chordSymbol} — piano`}
      className={cn(
        'block max-w-full',
        size === 'card'
          ? 'h-full w-full object-contain object-center'
          : 'h-auto w-full px-1',
        className
      )}
    />
  );
}
