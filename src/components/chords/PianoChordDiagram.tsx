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
    <div className={cn('w-full overflow-hidden leading-none', className)}>
      <img
        src={src}
        alt={`${chordSymbol} — piano`}
        className={cn(
          'block w-full',
          size === 'card' ? '-mt-[14%] -mb-[20%]' : '-mt-[10%] -mb-[14%]'
        )}
      />
    </div>
  );
}
