'use client';

import React, { useMemo } from 'react';
import type { Chord } from '@/types';
import ChordDiagram from '../ChordDiagram';
import { ChordVariantsCarousel } from '@/components/chords/ChordVariantsCarousel';
import { PianoChordDiagram } from '@/components/chords/PianoChordDiagram';
import { getChordVariantGroup } from '@/utils/chordVariantLookup';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import { useLanguage } from '@/context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChordDiagramModalProps {
  selectedChord: string;
  selectedInstrument: 'piano' | 'guitar';
  fontSize: number;
  onClose: () => void;
  chords?: Chord[];
}

export default function ChordDiagramModal({
  selectedChord,
  selectedInstrument,
  fontSize,
  onClose,
}: ChordDiagramModalProps) {
  const { t } = useLanguage();
  const variantGroup = useMemo(
    () => (selectedInstrument === 'guitar' ? getChordVariantGroup(selectedChord) : null),
    [selectedChord, selectedInstrument]
  );
  const showPianoSvg =
    selectedInstrument === 'piano' && hasPianoChordDiagram(selectedChord);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto border-border bg-card p-0 sm:max-w-md">
        <DialogHeader className="px-4 pb-0 pt-4 text-start">
          <DialogTitle className="text-xl font-bold text-foreground">
            {selectedChord}
          </DialogTitle>
        </DialogHeader>
        <div className="flex w-full flex-col items-start p-2 pt-0">
          {showPianoSvg ? (
            <div className="flex w-full flex-col items-start px-2 pb-4 pt-1">
              <PianoChordDiagram chordSymbol={selectedChord} size="modal" className="self-center" />
            </div>
          ) : variantGroup ? (
            <div className="flex w-full flex-col items-start px-2 pb-4 pt-1">
              <ChordVariantsCarousel
                variants={variantGroup.variants}
                chordSymbol={variantGroup.symbol}
                variant="compact"
                resetKey={selectedChord}
              />
            </div>
          ) : selectedInstrument === 'piano' ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('chords.noPianoDiagram')}
            </p>
          ) : (
            <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
