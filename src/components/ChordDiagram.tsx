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
    <div className="p-4 bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200 shadow-md">
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold text-amber-900 mb-1">{chord}</h4>
        <p className="text-sm text-amber-700">🎸 Guitare</p>
      </div>
      
      {/* String names */}
      <div className="flex justify-center gap-0 mb-1 text-xs text-gray-600">
        {['E', 'A', 'D', 'G', 'B', 'E'].map((stringName, index) => (
          <div key={index} className="w-12 text-center font-medium">
            {stringName}
          </div>
        ))}
      </div>
      
      {/* String indicators */}
      <div className="flex justify-center gap-0 mb-3">
        {shape.map((fret, index) => {
          const stringNum = 6 - index; // Reverse for display
          return (
            <div key={stringNum} className="w-12 text-center">
              {fret === -1 && (
                <div className="text-red-600 font-bold text-lg bg-red-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto">
                  ×
                </div>
              )}
              {fret === 0 && (
                <div className="text-green-600 font-bold text-lg bg-green-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto">
                  ○
                </div>
              )}
              {fret > 0 && (
                <div className="text-blue-700 font-semibold text-xs bg-blue-100 rounded px-2 py-1 mx-auto inline-block">
                  {fret}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Fretboard */}
      <div className="relative bg-amber-100 p-2 rounded-lg border border-amber-300">
        {/* Nut (if open strings) */}
        {shape.some(f => f === 0) && (
          <div className="absolute top-0 left-2 right-2 h-1 bg-gray-800 rounded-full"></div>
        )}
        
        <div className="grid grid-cols-6 gap-0 relative">
          {/* 5 frets */}
          {[1, 2, 3, 4, 5].map(fret => (
            <React.Fragment key={fret}>
              {shape.map((stringFret, stringIndex) => {
                const stringNum = 6 - stringIndex;
                const hasDot = stringFret > 0 && stringFret === fret;
                return (
                  <div
                    key={`${fret}-${stringNum}`}
                    className="w-12 h-12 border-r border-b border-amber-400 bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center relative"
                    style={{
                      borderRightColor: stringIndex === 0 ? '#d97706' : '#f59e0b',
                      borderBottomColor: fret === 5 ? '#d97706' : '#f59e0b'
                    }}
                  >
                    {/* String line */}
                    <div 
                      className="absolute inset-y-0 left-1/2 w-0.5 bg-gray-600 transform -translate-x-1/2"
                      style={{ opacity: 0.7 }}
                    />
                    
                    {/* Fret wire */}
                    <div 
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-700"
                      style={{ opacity: 0.8 }}
                    />
                    
                    {hasDot && (
                      <div className="w-7 h-7 bg-blue-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-10">
                        <span className="text-white text-xs font-bold">{stringFret}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Fret position markers */}
        <div className="absolute -bottom-8 left-0 right-0">
          <div className="flex justify-between px-6 text-xs text-amber-700 font-medium">
            <span>I</span>
            <span>II</span>
            <span className="relative">
              III
              {/* Position marker dot for 3rd fret */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-600 rounded-full"></div>
            </span>
            <span>IV</span>
            <span className="relative">
              V
              {/* Position marker dot for 5th fret */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-600 rounded-full"></div>
            </span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 text-xs text-gray-600 bg-white p-2 rounded border">
        <div className="flex justify-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-1">
              <span className="text-red-600 font-bold text-xs">×</span>
            </div>
            <span>Muet</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-1">
              <span className="text-green-600 font-bold text-xs">○</span>
            </div>
            <span>Ouvert</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-1"></div>
            <span>Frette</span>
          </div>
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
