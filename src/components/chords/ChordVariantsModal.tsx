'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChordVariantsCarousel } from './ChordVariantsCarousel';
import type { ChordInstrument } from './InstrumentToggle';
import { PianoChordDiagram } from './PianoChordDiagram';
import type { ChordVariantGroup } from '@/types/chordVariants';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import { useLanguage } from '@/context/LanguageContext';

interface ChordVariantsModalProps {
  group: ChordVariantGroup;
  instrument?: ChordInstrument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChordVariantsModal({
  group,
  instrument = 'guitar',
  open,
  onOpenChange,
}: ChordVariantsModalProps) {
  const { t } = useLanguage();
  const showPiano = instrument === 'piano' && hasPianoChordDiagram(group.symbol);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(100%-2rem,22rem)] max-w-[22rem] gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 max-h-[90vh]"
        closeButtonClassName="right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full opacity-100 hover:bg-muted"
        closeIconClassName="h-6 w-6"
      >
        <DialogHeader className="flex min-h-14 flex-row items-center justify-center space-y-0 px-14 py-0">
          <DialogTitle className="text-center text-xl font-bold leading-none text-foreground">
            {group.symbol}
          </DialogTitle>
          <DialogDescription className="sr-only">{group.intro}</DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col items-start px-4 pb-6 pt-2">
          {showPiano ? (
            <PianoChordDiagram chordSymbol={group.symbol} size="modal" className="w-full" />
          ) : instrument === 'piano' ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('chords.noPianoDiagram')}
            </p>
          ) : (
            <ChordVariantsCarousel
              variants={group.variants}
              chordSymbol={group.symbol}
              variant="compact"
              resetKey={open}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
