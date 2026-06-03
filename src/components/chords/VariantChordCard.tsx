'use client';

import { ChordPreviewCard } from './ChordPreviewCard';
import type { ChordVariantGroup } from '@/types/chordVariants';
import { cn } from '@/lib/utils';

interface VariantChordCardProps {
  group: ChordVariantGroup;
  onClick: () => void;
  className?: string;
}

/** Grid card — opens the variants modal on click */
export function VariantChordCard({ group, onClick, className }: VariantChordCardProps) {
  const preview = group.variants[0]?.chord;
  if (!preview) return null;

  const previewChord = { ...preview, name: group.symbol };

  return (
    <ChordPreviewCard
      chordLabel={group.symbol}
      diagram={previewChord}
      onClick={onClick}
      className={cn('w-full sm:w-full', className)}
      footer={
        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
          {group.variants.length} positions
        </span>
      }
    />
  );
}
