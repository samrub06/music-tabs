'use client';

import { useApp } from '@/context/AppContext';
import { extractAllChords, renderStructuredSong, transposeStructuredSong } from '@/utils/structuredSong';
import {
  ArrowLeftIcon,
  MinusIcon,
  MusicalNoteIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import ChordDiagram from './ChordDiagram';

export default function SongViewer() {
  const {
    currentSong,
    setCurrentSong,
    updateSong,
    deleteSong,
    selectedInstrument,
    setSelectedInstrument,
    transposeValue,
    setTransposeValue,
    autoScroll,
    toggleAutoScroll,
    setAutoScrollSpeed
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordDiagram, setShowChordDiagram] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentSong) {
      // Convert structured song back to raw text for editing
      setEditContent(renderStructuredSong(currentSong));
    }
  }, [currentSong]);

  // Auto-scroll functionality
  useEffect(() => {
    if (autoScroll.isActive && contentRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          const scrollAmount = autoScroll.speed * 0.5; // Adjust scroll speed
          contentRef.current.scrollTop += scrollAmount;
          
          // Stop if reached bottom
          if (contentRef.current.scrollTop >= 
              contentRef.current.scrollHeight - contentRef.current.clientHeight) {
            toggleAutoScroll();
          }
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll.isActive, autoScroll.speed, toggleAutoScroll]);

  if (!currentSong) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune chanson sélectionnée
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choisissez une chanson dans la liste pour la visualiser.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // For now, we'll keep the existing structure since we don't have a parser from text back to structured
    // In a real implementation, you'd parse editContent back to StructuredSong format
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(currentSong.id);
      setCurrentSong(null);
    }
  };

  const handleChordClick = (chord: string) => {
    setSelectedChord(chord);
    setShowChordDiagram(true);
  };

  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // All songs are now structured format - use structured rendering
  const transposedSong = transposeStructuredSong(currentSong, transposeValue);
  const transposedContent = renderStructuredSong(transposedSong, {
    maxWidth: 80,
    wordWrap: true,
    isMobile: window.innerWidth < 768
  });

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Header - Mobile Responsive */}
      <div className="flex-shrink-0 border-b border-gray-200">
        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setCurrentSong(null)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex-1 text-center px-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">{currentSong.title}</h1>
              {currentSong.author && (
                <p className="text-sm text-gray-600 truncate">Par {currentSong.author}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Mobile Controls */}
          <div className="px-3 pb-3 space-y-3">
            {/* Instrument Toggle - Mobile */}
            <div className="flex rounded-md shadow-sm w-full">
              <button
                onClick={() => setSelectedInstrument('piano')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${
                  selectedInstrument === 'piano'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎹 Piano
              </button>
              <button
                onClick={() => setSelectedInstrument('guitar')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  selectedInstrument === 'guitar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎸 Guitare
              </button>
            </div>

            {/* Controls Row - Mobile */}
            <div className="flex items-center justify-between">
              {/* Transpose Controls */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">Tonalité:</span>
                <button
                  onClick={() => setTransposeValue(Math.max(transposeValue - 1, -11))}
                  disabled={transposeValue <= -11}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium min-w-[2.5rem] text-center">
                  {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                </span>
                <button
                  onClick={() => setTransposeValue(Math.min(transposeValue + 1, 11))}
                  disabled={transposeValue >= 11}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Auto-scroll Controls */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <button
                  onClick={toggleAutoScroll}
                  className={`p-2 rounded-full ${
                    autoScroll.isActive
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                  }`}
                  title={autoScroll.isActive ? 'Arrêter' : 'Démarrer'}
                >
                  {autoScroll.isActive ? (
                    <PauseIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.1"
                  value={autoScroll.speed}
                  onChange={(e) => setAutoScrollSpeed(parseFloat(e.target.value))}
                  className="w-20"
                  title="Vitesse"
                />
                
                <button
                  onClick={resetScroll}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-white"
                  title="Haut"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentSong(null)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentSong.title}</h1>
              {currentSong.author && (
                <p className="text-sm text-gray-600">Par {currentSong.author}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Instrument Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setSelectedInstrument('piano')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  selectedInstrument === 'piano'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎹 Piano
              </button>
              <button
                onClick={() => setSelectedInstrument('guitar')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  selectedInstrument === 'guitar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎸 Guitare
              </button>
            </div>

            {/* Transpose Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTransposeValue(Math.max(transposeValue - 1, -11))}
                disabled={transposeValue <= -11}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
              </span>
              <button
                onClick={() => setTransposeValue(Math.min(transposeValue + 1, 11))}
                disabled={transposeValue >= 11}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-scroll Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoScroll}
                className={`p-2 rounded-full ${
                  autoScroll.isActive
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={autoScroll.isActive ? 'Arrêter le défilement' : 'Démarrer le défilement'}
              >
                {autoScroll.isActive ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>
              
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={autoScroll.speed}
                onChange={(e) => setAutoScrollSpeed(parseFloat(e.target.value))}
                className="w-16"
                title="Vitesse de défilement"
              />
              
              <button
                onClick={resetScroll}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                title="Remonter en haut"
              >
                ↑ Haut
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Éditer"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
              title="Supprimer"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            <div className="flex-1 flex flex-col p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contenu de la chanson..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(renderStructuredSong(currentSong));
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="flex-1 overflow-y-auto p-3 md:p-6 bg-gray-50"
              style={{ 
                height: 'calc(100vh - 200px)',
                WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
              }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Chord Diagrams Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MusicalNoteIcon className="w-5 h-5 mr-2" />
                    Accords utilisés
                  </h3>
                  <ChordDiagramsGrid song={transposedSong} onChordClick={handleChordClick} />
                </div>

                {/* Song Content */}
                <StructuredSongContent 
                  song={transposedSong} 
                  onChordClick={handleChordClick}
                />
              </div>
            </div>
          )}
        </div>

        {/* Chord Diagram Sidebar/Modal */}
        {showChordDiagram && selectedChord && (
          <>
            {/* Mobile Modal */}
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
              <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Diagramme d&apos;accord
                  </h3>
                  <button
                    onClick={() => setShowChordDiagram(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="p-4">
                  <ChordDiagram chord={selectedChord} instrument={selectedInstrument} />
                </div>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-96 border-l border-gray-200 bg-white">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Diagramme d&apos;accord
                </h3>
                <button
                  onClick={() => setShowChordDiagram(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <ChordDiagram chord={selectedChord} instrument={selectedInstrument} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface SongContentProps {
  content: string;
  onChordClick: (chord: string) => void;
}

function SongContent({ content, onChordClick }: SongContentProps) {
  // This is now just a fallback - we should render directly from structured data
  const lines = content.split('\n');
  
  const renderLineWithClickableChords = (line: string) => {
    // Chord pattern to detect chords in the text
    const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = chordPattern.exec(line)) !== null) {
      // Add text before chord
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Add clickable chord
      parts.push(
        <button
          key={`chord-${match.index}`}
          onClick={() => onChordClick(match![1])}
          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
        >
          {match![1]}
        </button>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    return parts.length > 1 ? parts : line;
  };
  
  return (
    <div className="font-mono text-sm leading-relaxed space-y-2">
      {lines.map((line, index) => (
        <div key={index} className="min-h-[1.5rem]">
          {line.trim() ? (
            <div className="text-gray-900">
              {renderLineWithClickableChords(line)}
            </div>
          ) : (
            <div className="h-4" /> // Empty line
          )}
        </div>
      ))}
    </div>
  );
}

// New structured song content renderer
interface StructuredSongContentProps {
  song: any; // StructuredSong type
  onChordClick: (chord: string) => void;
}

function StructuredSongContent({ song, onChordClick }: StructuredSongContentProps) {
  const renderSongLine = (line: any, lineIndex: number) => {
    if (line.type === 'lyrics_only') {
      return (
        <div key={lineIndex} className="text-gray-900 min-h-[1.5rem]">
          {line.lyrics || ''}
        </div>
      );
    }
    
    if (line.type === 'chords_only') {
      return (
        <div key={lineIndex} className="text-blue-600 font-semibold min-h-[1.5rem]">
          {line.chord_line ? renderClickableChordLine(line.chord_line) : ''}
        </div>
      );
    }
    
    if (line.type === 'chord_over_lyrics' && line.chords && line.lyrics) {
      return (
        <div key={lineIndex} className="mb-2">
          {/* Chord line with precise positioning */}
          <div className="text-blue-600 font-semibold min-h-[1.2rem] relative">
            {line.chords.map((chordPos: any, chordIndex: number) => (
              <button
                key={chordIndex}
                onClick={() => onChordClick(chordPos.chord)}
                className="absolute hover:text-blue-800 hover:underline cursor-pointer"
                style={{ left: `${chordPos.position * 0.6}em` }}
              >
                {chordPos.chord}
              </button>
            ))}
          </div>
          {/* Lyrics line */}
          <div className="text-gray-900 min-h-[1.2rem]">
            {line.lyrics}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  const renderClickableChordLine = (chordLine: string) => {
    const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = chordPattern.exec(chordLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(chordLine.substring(lastIndex, match.index));
      }
      
      parts.push(
        <button
          key={`chord-${match.index}`}
          onClick={() => onChordClick(match![1])}
          className="hover:text-blue-800 hover:underline cursor-pointer"
        >
          {match![1]}
        </button>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < chordLine.length) {
      parts.push(chordLine.substring(lastIndex));
    }
    
    return parts;
  };
  
  return (
    <div className="font-mono text-sm leading-relaxed space-y-4">
      {song.sections.map((section: any, sectionIndex: number) => (
        <div key={sectionIndex} className="mb-6">
          {/* Section header */}
          <div className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
            [{section.name}]
          </div>
          
          {/* Section lines */}
          <div className="space-y-1">
            {section.lines.map((line: any, lineIndex: number) => 
              renderSongLine(line, lineIndex)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Chord Diagrams Grid Component
interface ChordDiagramsGridProps {
  song: any; // StructuredSong type
  onChordClick: (chord: string) => void;
}

function ChordDiagramsGrid({ song, onChordClick }: ChordDiagramsGridProps) {
  const allChords = extractAllChords(song);
  
  if (allChords.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        Aucun accord détecté dans cette chanson
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {allChords.map((chord) => (
        <button
          key={chord}
          onClick={() => onChordClick(chord)}
          className="group p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
              {chord}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
