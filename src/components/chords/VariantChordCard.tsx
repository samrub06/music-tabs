'use client';

import { ChordPreviewCard } from './ChordPreviewCard';
import type { ChordInstrument } from './InstrumentToggle';
import type { ChordVariantGroup } from '@/types/chordVariants';
import { cn } from '@/lib/utils';

interface VariantChordCardProps {
  group: ChordVariantGroup;
  instrument?: ChordInstrument;
  onClick: () => void;
  className?: string;
}

/** Grid card — opens the variants modal on click */
export function VariantChordCard({
  group,
  instrument = 'guitar',
  onClick,
  className,
}: VariantChordCardProps) {
  const preview = group.variants[0]?.chord;
  if (!preview) return null;

  const previewChord = { ...preview, name: group.symbol };

  return (
    <ChordPreviewCard
      chordLabel={group.symbol}
      instrument={instrument}
      diagram={instrument === 'guitar' ? previewChord : null}
      onClick={onClick}
      className={cn(className)}
      footer={
        instrument === 'guitar' ? (
          <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
            {group.variants.length} positions
          </span>
        ) : undefined
      }
    />
  );
}
