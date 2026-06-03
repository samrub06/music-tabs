'use client';

import { VexChordDiagram } from './VexChordDiagram';
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col items-center rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-shadow',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      aria-label={`${group.title} — ${group.variants.length} positions`}
    >
      <div className="mb-2 pointer-events-none">
        <VexChordDiagram chord={previewChord} />
      </div>
      <div className="pointer-events-none text-center">
        <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          {group.symbol}
        </div>
        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
          {group.variants.length} positions
        </span>
      </div>
    </button>
  );
}
