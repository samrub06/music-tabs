'use client';

import React, { useMemo } from 'react';
import type { Chord } from '@/types';
import ChordDiagram from '../ChordDiagram';
import { ChordVariantsCarousel } from '@/components/chords/ChordVariantsCarousel';
import { getChordVariantGroup } from '@/utils/chordVariantLookup';
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
  const variantGroup = useMemo(
    () => (selectedInstrument === 'guitar' ? getChordVariantGroup(selectedChord) : null),
    [selectedChord, selectedInstrument]
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-md overflow-y-auto border-border bg-card p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {variantGroup ? variantGroup.title : `Diagramme — ${selectedChord}`}
          </DialogTitle>
        </DialogHeader>
        <div className="p-2">
          {variantGroup ? (
            <div className="flex flex-col items-center px-2 pb-4 pt-2">
              <ChordVariantsCarousel
                variants={variantGroup.variants}
                chordSymbol={variantGroup.symbol}
                variant="compact"
                resetKey={selectedChord}
              />
            </div>
          ) : (
            <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
