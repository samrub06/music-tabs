'use client';

import React, { useEffect, useRef } from 'react';
import { ChordBox } from 'vexchords';
import type { Chord } from '@/types';
import { mapChordNicknameToDbName, normalizeChordNameForComparison } from '@/utils/chords';
import ChordDiagram from '../ChordDiagram';

interface ChordDiagramModalProps {
  selectedChord: string;
  selectedInstrument: 'piano' | 'guitar';
  fontSize: number;
  onClose: () => void;
  chords?: Chord[];
}

// Find chord in database by matching song chord name
function findChordInDatabase(songChordName: string, chords: Chord[]): Chord | null {
  if (!chords || chords.length === 0) return null;
  
  // First try: map nickname to database name and find exact match
  const dbName = mapChordNicknameToDbName(songChordName);
  const normalizedDbName = normalizeChordNameForComparison(dbName);
  
  for (const chord of chords) {
    const normalizedChordName = normalizeChordNameForComparison(chord.name);
    if (normalizedChordName === normalizedDbName) {
      return chord;
    }
  }
  
  // Second try: direct match (for chords like "C7", "Dsus4" that match directly)
  const normalizedSongChord = normalizeChordNameForComparison(songChordName);
  for (const chord of chords) {
    const normalizedChordName = normalizeChordNameForComparison(chord.name);
    if (normalizedChordName === normalizedSongChord) {
      return chord;
    }
  }
  
  return null;
}

export default function ChordDiagramModal({
  selectedChord,
  selectedInstrument,
  fontSize,
  onClose,
  chords = []
}: ChordDiagramModalProps) {
  const chordRef = useRef<HTMLDivElement>(null);
  const chordBoxRef = useRef<ChordBox | null>(null);

  // Render chord diagram using ChordBox for guitar
  useEffect(() => {
    if (selectedInstrument !== 'guitar' || chords.length === 0 || !chordRef.current) return;
    
    const dbChord = findChordInDatabase(selectedChord, chords);
    if (!dbChord) return;
    
    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!chordRef.current) return;
      
      // Clear container
      chordRef.current.innerHTML = '';
      
      // Remove old ChordBox instance if it exists
      if (chordBoxRef.current) {
        chordBoxRef.current = null;
      }
      
      // Create new ChordBox instance
      const chordBox = new ChordBox(chordRef.current, {
        width: 130,
        height: 150,
        defaultColor: '#444',
        showTuning: true
      });
      
      // Store the ChordBox instance
      chordBoxRef.current = chordBox;
      
      // Draw the chord
      chordBox.draw({
        chord: dbChord.chordData.chord,
        position: dbChord.chordData.position,
        barres: dbChord.chordData.barres,
        tuning: dbChord.tuning
      });
    }, 0);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (chordBoxRef.current) {
        chordBoxRef.current = null;
      }
    };
  }, [selectedChord, selectedInstrument, chords]);

  const dbChord = selectedInstrument === 'guitar' ? findChordInDatabase(selectedChord, chords) : null;
  const hasVexChordDiagram = selectedInstrument === 'guitar' && dbChord !== null;

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
            {hasVexChordDiagram ? (
              <>
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedChord}</h4>
                </div>
                <div ref={chordRef} className="flex justify-center" />
              </>
            ) : (
              <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
            )}
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
          {hasVexChordDiagram ? (
            <>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{selectedChord}</h4>
              </div>
              <div ref={chordRef} className="flex justify-center" />
            </>
          ) : (
            <ChordDiagram chord={selectedChord} instrument={selectedInstrument} fontSize={fontSize} />
          )}
        </div>
      </div>
    </>
  );
}
