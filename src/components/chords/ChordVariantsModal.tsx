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
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-border bg-card p-0 sm:max-w-md">
        <DialogHeader className="px-4 pb-0 pt-4 text-start">
          <DialogTitle className="text-xl font-bold text-foreground">
            {group.symbol}
          </DialogTitle>
          <DialogDescription className="sr-only">{group.intro}</DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col items-start px-4 pb-6 pt-2">
          {showPiano ? (
            <PianoChordDiagram chordSymbol={group.symbol} size="modal" className="self-center" />
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
