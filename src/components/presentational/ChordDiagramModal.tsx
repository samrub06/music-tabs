'use client';

import React from 'react';
import type { Chord } from '@/types';
import ChordDiagram from '../ChordDiagram';
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
  chords = [],
}: ChordDiagramModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diagramme d&apos;accord</DialogTitle>
        </DialogHeader>
        <div className="p-2">
          <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
