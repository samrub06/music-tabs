'use client';

import React from 'react';
import ChordDiagram from '../ChordDiagram';

interface ChordDiagramModalProps {
  selectedChord: string;
  selectedInstrument: 'piano' | 'guitar';
  fontSize: number;
  onClose: () => void;
}

export default function ChordDiagramModal({
  selectedChord,
  selectedInstrument,
  fontSize,
  onClose
}: ChordDiagramModalProps) {
  return (
    <>
      {/* Mobile Modal */}
      <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">
              Diagramme d&apos;accord
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <div className="p-4">
            <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[450px] border-l border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Diagramme d&apos;accord
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
        </div>
      </div>
    </>
  );
}
