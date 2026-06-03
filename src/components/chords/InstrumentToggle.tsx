'use client';

import { Guitar, Piano } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export type ChordInstrument = 'piano' | 'guitar';

interface InstrumentToggleProps {
  value: ChordInstrument;
  onChange: (value: ChordInstrument) => void;
  className?: string;
  /** Hide label when placed inline with filter selects */
  compact?: boolean;
}

export function InstrumentToggle({
  value,
  onChange,
  className,
  compact = false,
}: InstrumentToggleProps) {
  const { t } = useLanguage();

  const segmentClass =
    'inline-flex h-11 shrink-0 items-center rounded-xl border border-border bg-card p-0.5';
  const optionClass = (active: boolean) =>
    cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'shrink-0' : 'gap-2',
        className
      )}
    >
      {!compact && (
        <span className="text-sm font-medium text-muted-foreground">
          {t('chords.instrument')}
        </span>
      )}
      <div className={segmentClass} role="group" aria-label={t('chords.instrument')}>
        <button
          type="button"
          onClick={() => onChange('piano')}
          className={optionClass(value === 'piano')}
          aria-label={t('songHeader.piano')}
          aria-pressed={value === 'piano'}
        >
          <Piano className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange('guitar')}
          className={optionClass(value === 'guitar')}
          aria-label={t('songHeader.guitar')}
          aria-pressed={value === 'guitar'}
        >
          <Guitar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
