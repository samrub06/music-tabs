'use client';

import { InstrumentType } from '@/types';
import { GUITAR_SHAPES, generatePianoVoicing } from '@/utils/chords';
import React from 'react';

interface ChordDiagramProps {
  chord: string;
  instrument: InstrumentType;
}

export default function ChordDiagram({ chord, instrument }: ChordDiagramProps) {
  if (instrument === 'guitar') {
    return <GuitarDiagram chord={chord} />;
  } else {
    return <PianoDiagram chord={chord} />;
  }
}

function GuitarDiagram({ chord }: { chord: string }) {
  // Get guitar shape or create a basic one
  const shape = GUITAR_SHAPES[chord] || [-1, -1, -1, -1, -1, -1];
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{chord} - Guitare</h4>
      </div>
      
      {/* String indicators */}
      <div className="flex justify-center gap-0 mb-2">
        {shape.map((fret, index) => {
          const stringNum = 6 - index; // Reverse for display
          return (
            <div key={stringNum} className="w-10 text-center text-xs">
              {fret === -1 && <span className="text-red-600 font-bold">×</span>}
              {fret === 0 && <span className="text-green-600 font-bold">○</span>}
              {fret > 0 && <span className="text-gray-600 text-xs">f{fret}</span>}
            </div>
          );
        })}
      </div>
      
      {/* Fretboard */}
      <div className="relative">
        <div className="grid grid-cols-6 gap-0 border border-gray-300">
          {/* 5 frets */}
          {[1, 2, 3, 4, 5].map(fret => (
            <React.Fragment key={fret}>
              {shape.map((stringFret, stringIndex) => {
                const stringNum = 6 - stringIndex;
                const hasDot = stringFret > 0 && stringFret === fret;
                return (
                  <div
                    key={`${fret}-${stringNum}`}
                    className="w-10 h-9 border-r border-b border-gray-300 bg-white flex items-center justify-center relative"
                  >
                    {hasDot && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Fret numbers */}
        <div className="flex justify-center mt-2 space-x-8 text-xs text-gray-500">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>
    </div>
  );
}

function PianoDiagram({ chord }: { chord: string }) {
  const voicings = generatePianoVoicing(chord);
  
  if (voicings.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">{chord} - Piano</h4>
          <p className="text-sm text-gray-500">Accord non reconnu</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center mb-4">
        <h4 className="text-sm font-semibold text-gray-900">{chord} - Piano</h4>
      </div>
      
      {voicings.map((voicing, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <div className="text-center text-xs text-gray-600 mb-2">
            {voicing}
          </div>
          <PianoKeyboard activeNotes={voicing.split(' ')} />
        </div>
      ))}
    </div>
  );
}

function PianoKeyboard({ activeNotes }: { activeNotes: string[] }) {
  const keys = [
    { note: 'C', type: 'white' },
    { note: 'C#', type: 'black' },
    { note: 'D', type: 'white' },
    { note: 'D#', type: 'black' },
    { note: 'E', type: 'white' },
    { note: 'F', type: 'white' },
    { note: 'F#', type: 'black' },
    { note: 'G', type: 'white' },
    { note: 'G#', type: 'black' },
    { note: 'A', type: 'white' },
    { note: 'A#', type: 'black' },
    { note: 'B', type: 'white' }
  ];
  
  return (
    <div className="relative flex justify-center items-end h-20">
      {keys.map((key) => {
        const isActive = activeNotes.includes(key.note);
        const isBlack = key.type === 'black';
        
        return (
          <div
            key={key.note}
            className={`
              ${isBlack 
                ? 'w-4 h-12 bg-gray-900 -mx-2 z-10 relative' 
                : 'w-7 h-20 bg-white border border-gray-300'
              }
              ${isActive && isBlack ? 'bg-orange-500' : ''}
              ${isActive && !isBlack ? 'bg-yellow-200' : ''}
              flex items-end justify-center pb-1
            `}
          >
            <span className="text-xs text-gray-600 select-none">
              {key.note.replace('#', '♯')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
