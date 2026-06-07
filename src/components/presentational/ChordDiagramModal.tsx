'use client';

import React, { useMemo } from 'react';
import ChordDiagram from '../ChordDiagram';
import UnknownChordFallback from './UnknownChordFallback';
import { ChordVariantsCarousel } from '@/components/chords/ChordVariantsCarousel';
import { PianoChordDiagram } from '@/components/chords/PianoChordDiagram';
import { getChordVariantGroup, hasChordDiagramForInstrument } from '@/utils/chordVariantLookup';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import { GUITAR_SHAPES } from '@/utils/chords';
import { generatePianoVoicing } from '@/utils/chords';
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
  isAuthenticated?: boolean;
}

export default function ChordDiagramModal({
  selectedChord,
  selectedInstrument,
  fontSize,
  onClose,
  isAuthenticated = true,
}: ChordDiagramModalProps) {
  const variantGroup = useMemo(
    () => (selectedInstrument === 'guitar' ? getChordVariantGroup(selectedChord) : null),
    [selectedChord, selectedInstrument]
  );
  const showPianoSvg =
    selectedInstrument === 'piano' && hasPianoChordDiagram(selectedChord);
  const hasDiagram = useMemo(
    () => hasChordDiagramForInstrument(selectedChord, selectedInstrument),
    [selectedChord, selectedInstrument]
  );
  const showLegacyGuitarDiagram =
    selectedInstrument === 'guitar' &&
    !variantGroup &&
    !!GUITAR_SHAPES[selectedChord];
  const showLegacyPianoDiagram =
    selectedInstrument === 'piano' &&
    !showPianoSvg &&
    generatePianoVoicing(selectedChord).length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto border-border bg-card p-0 sm:max-w-md">
        <DialogHeader className="flex min-h-14 flex-row items-center justify-center space-y-0 px-12 py-0">
          <DialogTitle className="text-center text-xl font-bold leading-none text-foreground">
            {selectedChord}
          </DialogTitle>
        </DialogHeader>
        <div className="flex w-full flex-col items-center p-2 pt-0">
          {!hasDiagram ? (
            <UnknownChordFallback
              chordName={selectedChord}
              instrument={selectedInstrument}
              isAuthenticated={isAuthenticated}
            />
          ) : showPianoSvg ? (
            <div className="flex w-full flex-col items-start px-2 pb-4 pt-1">
              <PianoChordDiagram chordSymbol={selectedChord} size="modal" className="w-full" />
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
          ) : showLegacyPianoDiagram || showLegacyGuitarDiagram ? (
            <div className="flex w-full flex-col items-start px-2 pb-4 pt-1">
              <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
