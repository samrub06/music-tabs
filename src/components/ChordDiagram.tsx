'use client';

import { InstrumentType } from '@/types';
import { GUITAR_SHAPES, generatePianoVoicing } from '@/utils/chords';
// Removed react-piano - using custom piano component

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

// Multiple guitar chord positions with SVG
function GuitarDiagram({ chord }: { chord: string }) {
  // Generate multiple chord positions
  const generateChordPositions = (chord: string) => {
    const baseShape = GUITAR_SHAPES[chord];
    if (!baseShape) return [];
    
    const positions = [baseShape]; // Base position
    
    // Generate alternative positions (transposed up the neck)
    const alternativePositions = [
      // Position 2: Move everything up 2 frets
      baseShape.map(fret => fret === -1 ? -1 : fret === 0 ? 2 : fret + 2),
      // Position 3: Move everything up 5 frets  
      baseShape.map(fret => fret === -1 ? -1 : fret === 0 ? 5 : fret + 5),
      // Position 4: Move everything up 7 frets
      baseShape.map(fret => fret === -1 ? -1 : fret === 0 ? 7 : fret + 7)
    ];
    
    return [baseShape, ...alternativePositions];
  };
  
  const chordPositions = generateChordPositions(chord);
  
  if (chordPositions.length === 0) {
    return (
      <div className="p-2 bg-white rounded border border-gray-200 shadow-sm">
        <div className="text-center">
          <h4 className="text-sm font-bold text-gray-800 mb-1">{chord}</h4>
          <p className="text-xs text-gray-500 mt-1">Accord non reconnu</p>
        </div>
      </div>
    );
  }
  
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'E'];
  const frets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const stringWidth = 20;
  const fretHeight = 18;
  const totalWidth = stringNames.length * stringWidth;
  const totalHeight = frets.length * fretHeight;
  const positionNames = ['Pos.1', 'Pos.2', 'Pos.3', 'Pos.4'];

  return (
    <div className="p-1 bg-white rounded border border-gray-200 shadow-sm">
      <div className="text-center mb-2">
        <h4 className="text-xs font-bold text-gray-800 mb-1">{chord}</h4>
        <p className="text-xs text-gray-600">4 positions</p>
      </div>
      
      <div className="space-y-2">
        {chordPositions.slice(0, 4).map((shape, positionIndex) => (
          <div key={positionIndex} className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">
              {positionNames[positionIndex]}
            </div>
            <div className="flex justify-center">
              <div className="relative">
                {/* Fret numbers on the left */}
                <div className="absolute -left-6 top-0 h-full flex flex-col justify-around">
                  {frets.map((fret, fretIndex) => (
                    <div
                      key={fret}
                      className="text-xs font-bold text-gray-600 text-center"
                      style={{ height: `${fretHeight}px`, lineHeight: `${fretHeight}px` }}
                    >
                      {fret}
                    </div>
                  ))}
                </div>
                
                <svg width={totalWidth} height={totalHeight + 20} className="border border-gray-300 rounded">
                  {/* String names */}
                  {stringNames.map((name, index) => (
                    <text
                      key={name}
                      x={index * stringWidth + stringWidth / 2}
                      y={15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-gray-700"
                      fontSize="11"
                    >
                      {name}
                    </text>
                  ))}
                  
                  {/* Fret lines */}
                  {frets.map((fret, fretIndex) => (
                    <line
                      key={fret}
                      x1={0}
                      y1={20 + fretIndex * fretHeight}
                      x2={totalWidth}
                      y2={20 + fretIndex * fretHeight}
                      stroke="#374151"
                      strokeWidth={fret === 0 ? 2 : 1}
                    />
                  ))}
                  
                  {/* String lines */}
                  {stringNames.map((_, stringIndex) => (
                    <line
                      key={stringIndex}
                      x1={stringIndex * stringWidth + stringWidth / 2}
                      y1={20}
                      x2={stringIndex * stringWidth + stringWidth / 2}
                      y2={20 + frets.length * fretHeight}
                      stroke="#6b7280"
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Chord positions */}
                  {shape.map((fret, stringIndex) => {
                    if (fret === -1) {
                      // Muted string
                      return (
                        <text
                          key={`mute-${stringIndex}`}
                          x={stringIndex * stringWidth + stringWidth / 2}
                          y={15}
                          textAnchor="middle"
                          className="text-xs font-bold fill-red-600"
                          fontSize="11"
                        >
                          ×
                        </text>
                      );
                    }
                    
                    if (fret === 0) {
                      // Open string
                      return (
                        <circle
                          key={`open-${stringIndex}`}
                          cx={stringIndex * stringWidth + stringWidth / 2}
                          cy={20 + fretHeight / 2}
                          r={5}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      );
                    }
                    
                    if (fret > 0 && fret <= 12) {
                      // Fingered position
                      return (
                        <circle
                          key={`fret-${stringIndex}-${fret}`}
                          cx={stringIndex * stringWidth + stringWidth / 2}
                          cy={20 + (fret - 0.5) * fretHeight}
                          r={6}
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }
                    
                    return null;
                  })}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PianoDiagram({ chord }: { chord: string }) {
  const voicings = generatePianoVoicing(chord);
  
  if (voicings.length === 0) {
    return (
      <div className="p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 shadow-md">
        <div className="text-center">
          <h4 className="text-lg font-bold text-blue-900 mb-2">{chord}</h4>
          <p className="text-sm text-blue-700">🎹 Piano</p>
          <p className="text-sm text-blue-500 mt-2">Accord non reconnu</p>
        </div>
      </div>
    );
  }
  
  // Determine chord quality for title - ENHANCED
  const getChordQuality = (chord: string) => {
    const quality = chord.toLowerCase();
    
    if (quality.includes('maj7')) {
      return 'Major 7th';
    }
    if (quality.includes('m7')) {
      return 'Minor 7th';
    }
    if (quality.includes('7')) {
      return '7th';
    }
    if (quality.includes('9')) {
      return '9th';
    }
    if (quality.includes('sus4')) {
      return 'Suspended 4th';
    }
    if (quality.includes('sus2')) {
      return 'Suspended 2nd';
    }
    if (quality.includes('dim')) {
      return 'Diminished';
    }
    if (quality.includes('aug')) {
      return 'Augmented';
    }
    if (quality.includes('add')) {
      return 'Added Tone';
    }
    if (quality.includes('m') && !quality.includes('maj')) {
      return 'Minor';
    }
    if (quality.includes('4')) {
      return '4th Extension';
    }
    if (quality.includes('5')) {
      return '5th Extension';
    }
    if (quality.includes('6')) {
      return '6th Extension';
    }
    
    return 'Major';
  };

  const inversionNames = ['Root Position', 'First Inversion', 'Second Inversion'];
  
  return (
    <div className="p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 shadow-md">
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-blue-900 mb-1 border-b-2 border-blue-800 inline-block px-2">
          {chord} {getChordQuality(chord)}
        </h4>
        <p className="text-sm text-blue-700 mt-2">🎹 Piano</p>
      </div>
      
      <div className="space-y-2">
        {voicings.slice(0, 3).map((voicing, index) => {
          console.log(`🎹 ${chord} ${inversionNames[index]}: "${voicing}" -> [${voicing.split(' ').join(', ')}]`);
          return (
            <div key={index} className="text-center">
              <div className="text-xs font-bold text-blue-800 mb-1 bg-blue-100 rounded px-2 py-1 inline-block">
                {inversionNames[index]}: {voicing.split(' ').join(' - ')}
              </div>
              <PianoKeyboard 
                activeNotes={voicing.split(' ')} 
                showNoteNames={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom SVG Piano Component - Ultra Beautiful with Octave Support
function PianoKeyboard({ 
  activeNotes, 
  showNoteNames = false, 
  inversionLabel 
}: { 
  activeNotes: string[]; 
  showNoteNames?: boolean; 
  inversionLabel?: string;
}) {
  // Parse notes with octaves (e.g., "C4", "E4", "G4")
  const parseNoteWithOctave = (noteWithOctave: string) => {
    const match = noteWithOctave.match(/^([A-G]#?)(\d+)$/);
    if (match) {
      return { note: match[1], octave: parseInt(match[2]) };
    }
    // Fallback for notes without octave
    return { note: noteWithOctave, octave: 4 };
  };

  const parsedNotes = activeNotes.map(parseNoteWithOctave);
  
  // Create keyboard layout for 2 octaves (C4 to B5)
  const octaves = [4, 5];
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = [
    { note: 'C#', position: 0.7 },
    { note: 'D#', position: 1.7 },
    { note: 'F#', position: 3.7 },
    { note: 'G#', position: 4.7 },
    { note: 'A#', position: 5.7 }
  ];

  const keyWidth = 18; // Even smaller keys
  const whiteKeyHeight = 60; // Even smaller height
  const blackKeyHeight = 40; // Even smaller height
  const octaveWidth = whiteKeys.length * keyWidth;
  const totalWidth = octaves.length * octaveWidth;

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded shadow p-1 border border-gray-200">
        <svg width={totalWidth} height={whiteKeyHeight + 10} className="drop-shadow-lg">
          {/* Render each octave */}
          {octaves.map((octave, octaveIndex) => (
            <g key={octave} transform={`translate(${octaveIndex * octaveWidth}, 0)`}>
              {/* White Keys for this octave */}
              {whiteKeys.map((note, index) => {
                const noteWithOctave = `${note}${octave}`;
                const isActive = parsedNotes.some(p => p.note === note && p.octave === octave);
                return (
                  <g key={noteWithOctave}>
                    <rect
                      x={index * keyWidth}
                      y={0}
                      width={keyWidth - 1}
                      height={whiteKeyHeight}
                      fill={isActive ? '#3b82f6' : '#ffffff'}
                      stroke="#d1d5db"
                      strokeWidth="0.5"
                      rx="2"
                      ry="2"
                    />
                    {/* Note label with better visibility for extensions */}
                    {isActive && (
                      <text
                        x={index * keyWidth + keyWidth / 2}
                        y={whiteKeyHeight - 6}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {note.replace('#', '♯')}{octave}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Black Keys for this octave */}
              {blackKeys.map(({ note, position }) => {
                const noteWithOctave = `${note}${octave}`;
                const isActive = parsedNotes.some(p => p.note === note && p.octave === octave);
                return (
                  <g key={noteWithOctave}>
                    <rect
                      x={position * keyWidth - 6}
                      y={0}
                      width={12}
                      height={blackKeyHeight}
                      fill={isActive ? '#1e40af' : '#1f2937'}
                      stroke="#374151"
                      strokeWidth="0.5"
                      rx="1"
                      ry="1"
                    />
                    {/* Note label with better visibility for extensions */}
                    {isActive && (
                      <text
                        x={position * keyWidth}
                        y={blackKeyHeight - 5}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {note.replace('#', '♯')}{octave}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Simple design - no gradients */}
        </svg>
      </div>
      
      {/* Note labels removed - now shown in header */}
    </div>
  );
}
