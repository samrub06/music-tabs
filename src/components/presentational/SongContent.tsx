'use client';

import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { getOptimalLineHeight, getResponsiveFontSize, needsWrapping, wrapLyricsWithChords, type TextMeasurementOptions } from '@/utils/textMeasurement';
import ChordDiagram from '../ChordDiagram';

import Link from 'next/link';

interface SongContentProps {
  isEditing: boolean;
  editContent: string;
  transposedSong: any;
  transposedContent: string;
  fontSize: number;
  contentRef: RefObject<HTMLDivElement>;
  isSaving: boolean;
  onEditContentChange: (content: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onChordClick: (chord: string) => void;
  isAuthenticated?: boolean;
}

export default function SongContent({
  isEditing,
  editContent,
  transposedSong,
  transposedContent,
  fontSize,
  contentRef,
  isSaving,
  onEditContentChange,
  onSave,
  onCancelEdit,
  onChordClick,
  isAuthenticated = false
}: SongContentProps) {
  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditContentChange(e.target.value)}
          className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Contenu de la chanson..."
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={contentRef}
      className={`song-content-scrollable flex-1 ${!isAuthenticated ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden p-3 md:p-6 bg-gray-50 min-h-0 relative`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        maxHeight: 'calc(100vh - 200px)',
        width: '100%',
        maxWidth: '100%'
      }}
    >
      <div className="max-w-4xl mx-auto w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {/* Chord Diagrams Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MusicalNoteIcon className="w-5 h-5 mr-2" />
            Accords utilisés
          </h3>
          <ChordDiagramsGrid song={transposedSong} onChordClick={onChordClick} fontSize={fontSize} />
        </div>

        {/* Song Content */}
        <StructuredSongContent 
          song={transposedSong} 
          onChordClick={onChordClick}
          fontSize={fontSize}
        />
      </div>

      {!isAuthenticated && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 z-20 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent backdrop-blur-[1px]">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl border border-gray-200 max-w-sm mx-4 text-center transform translate-y-2">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Chanson complète masquée
            </h3>
            <p className="text-gray-600 mb-6">
              Connectez-vous pour accéder à l&apos;intégralité de la chanson et l&apos;ajouter à votre bibliothèque.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login?next=/explore"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                Se connecter
              </Link>
              <Link
                href="/register?next=/explore"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Structured song content renderer
interface StructuredSongContentProps {
  song: any;
  onChordClick: (chord: string) => void;
  fontSize: number;
}

function StructuredSongContent({ song, onChordClick, fontSize }: StructuredSongContentProps) {
  const measurementRef = useRef<HTMLDivElement>(null);
  
  // Detect if content contains Hebrew/RTL text
  const containsHebrew = (text: string) => {
    return /[\u0590-\u05FF\u200F\u200E]/.test(text);
  };

  // Calculate character width based on font size for precise alignment
  const getCharWidth = (fontSize: number) => {
    return fontSize * 0.58;
  };

  // Get actual text width using canvas for precise measurements
  const getTextWidth = (text: string, fontSize: number): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * getCharWidth(fontSize);
    
    context.font = `${fontSize}px Monaco, "Lucida Console", "Courier New", monospace`;
    return context.measureText(text).width;
  };

  // Hook to detect mobile/tablet for performance optimization
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setIsMobile(true);
        setScreenSize('mobile');
      } else if (width < 1024) {
        setIsMobile(false);
        setScreenSize('tablet');
      } else {
        setIsMobile(false);
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get optimal font size based on screen size
  const getOptimalFontSize = (baseFontSize: number): number => {
    return getResponsiveFontSize(baseFontSize, window.innerWidth);
  };

  const renderSongLine = (line: any, lineIndex: number) => {
    const optimalFontSize = getOptimalFontSize(fontSize);
    const optimalLineHeight = getOptimalLineHeight(optimalFontSize);
    
    if (line.type === 'lyrics_only') {
      const isHebrew = line.lyrics && containsHebrew(line.lyrics);
      return (
        <div key={lineIndex} className="text-gray-900 min-h-[1.8rem] break-words w-full" dir={isHebrew ? 'rtl' : 'ltr'} style={{ 
          fontSize: `${optimalFontSize}px`, 
          lineHeight: optimalLineHeight,
          fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          maxWidth: '100%',
          width: '100%'
        }}>
          {line.lyrics || ''}
        </div>
      );
    }
    
    if (line.type === 'chords_only') {
      return (
        <div key={lineIndex} className="text-blue-600 font-semibold min-h-[1.8rem] break-words w-full" style={{ 
          fontSize: `${optimalFontSize}px`, 
          lineHeight: optimalLineHeight,
          fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          maxWidth: '100%',
          width: '100%'
        }}>
          {line.chord_line ? renderClickableChordLine(line.chord_line) : ''}
        </div>
      );
    }
    
    if (line.type === 'chord_over_lyrics' && line.chords && line.lyrics) {
      const isHebrew = containsHebrew(line.lyrics);
      return (
        <ChordOverLyricsLine 
          key={lineIndex}
          line={line}
          isHebrew={isHebrew}
          fontSize={optimalFontSize}
          onChordClick={onChordClick}
        />
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
  
  const optimalFontSize = getOptimalFontSize(fontSize);
  const optimalLineHeight = getOptimalLineHeight(optimalFontSize);

  return (
    <div className="leading-relaxed space-y-4 w-full overflow-x-hidden" style={{ 
      fontSize: `${optimalFontSize}px`,
      lineHeight: optimalLineHeight,
      fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
      maxWidth: '100%',
      width: '100%'
    }}>
      {/* Hidden measurement element for precise text width calculations */}
      <div 
        ref={measurementRef}
        className="absolute -top-[9999px] left-0 opacity-0 pointer-events-none whitespace-pre"
        style={{ 
          fontSize: `${optimalFontSize}px`,
          fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace'
        }}
        aria-hidden="true"
      />
      
      {song.sections.map((section: any, sectionIndex: number) => {
        // Filtrer la section Version Description
        if (section.name === 'Version Description') return null;
        
        return (
          <div key={sectionIndex} className="mb-6 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            {/* Section header */}
            <div className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1" style={{ 
              fontSize: `${optimalFontSize + 4}px`,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%'
            }}>
              [{section.name}]
            </div>
            
            {/* Section lines */}
            <div className="space-y-1 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {section.lines.map((line: any, lineIndex: number) => 
                renderSongLine(line, lineIndex)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component for precise chord-over-lyrics alignment
interface ChordOverLyricsLineProps {
  line: any;
  isHebrew: boolean;
  fontSize: number;
  onChordClick: (chord: string) => void;
}

function ChordOverLyricsLine({ line, isHebrew, fontSize, onChordClick }: ChordOverLyricsLineProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Measure container width for responsive chord positioning
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [fontSize]);

  // Calculate character width based on font size (monospace)
  const charWidth = fontSize * 0.58;
  
  // Check if line needs wrapping using the utility function
  const measurementOptions: TextMeasurementOptions = {
    fontSize,
    fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
    containerWidth: Math.max(containerWidth, 300),
    padding: 20
  };
  
  const needsWrappingCheck = needsWrapping(line.lyrics, measurementOptions);
  
  if (!needsWrappingCheck) {
    // Simple case: no wrapping needed
    return (
      <div ref={containerRef} className="mb-2 w-full" dir={isHebrew ? 'rtl' : 'ltr'} style={{ 
        fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {/* Chord line */}
        <div className="text-blue-600 font-semibold min-h-[1.8rem] relative w-full" style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: 1.4,
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {line.chords.map((chordPos: any, chordIndex: number) => {
            // Ensure chord doesn't go beyond lyrics length
            const safePosition = Math.min(chordPos.position, line.lyrics.length);
            const leftOffset = Math.min(safePosition * charWidth, containerWidth - 50); // Prevent overflow
            
            return (
              <button
                key={chordIndex}
                onClick={() => onChordClick(chordPos.chord)}
                className="absolute hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap z-10"
                style={{ 
                  left: isHebrew ? 'auto' : `${leftOffset}px`,
                  right: isHebrew ? `${leftOffset}px` : 'auto',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.4,
                  maxWidth: 'calc(100vw - 40px)'
                }}
              >
                {chordPos.chord}
              </button>
            );
          })}
        </div>
        {/* Lyrics line */}
        <div className="text-gray-900 min-h-[1.8rem] w-full" style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: 1.4,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          maxWidth: '100%'
        }}>
          {line.lyrics}
        </div>
      </div>
    );
  }
  
  // Complex case: wrapping needed
  return (
    <WrappedChordLyricsLine 
      ref={containerRef}
      line={line}
      isHebrew={isHebrew}
      fontSize={fontSize}
      measurementOptions={measurementOptions}
      onChordClick={onChordClick}
    />
  );
}

// Component for handling wrapped chord-lyrics lines
interface WrappedChordLyricsLineProps {
  line: any;
  isHebrew: boolean;
  fontSize: number;
  measurementOptions: TextMeasurementOptions;
  onChordClick: (chord: string) => void;
}

const WrappedChordLyricsLine = React.forwardRef<HTMLDivElement, WrappedChordLyricsLineProps>(
  ({ line, isHebrew, fontSize, measurementOptions, onChordClick }, ref) => {
    // Use the utility function for intelligent wrapping
    const wrappedLines = wrapLyricsWithChords(line.lyrics, line.chords, measurementOptions);
    
    const lineHeight = getOptimalLineHeight(fontSize);
    
    return (
      <div ref={ref} className="mb-2 w-full" dir={isHebrew ? 'rtl' : 'ltr'} style={{ 
        fontFamily: 'Monaco, "Lucida Console", "Courier New", monospace',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {wrappedLines.map((wrappedLine, lineIndex) => (
          <div key={lineIndex} className="mb-1 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            {/* Chord line for this wrapped line */}
            <div className="text-blue-600 font-semibold min-h-[1.8rem] relative w-full" style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight,
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {wrappedLine.chords.map((chordPos, chordIndex) => {
                const leftOffset = Math.max(0, Math.min(chordPos.position * (fontSize * 0.58), measurementOptions.containerWidth - 50));
                
                return (
                  <button
                    key={chordIndex}
                    onClick={() => onChordClick(chordPos.chord)}
                    className="absolute hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap z-10"
                    style={{ 
                      left: isHebrew ? 'auto' : `${leftOffset}px`,
                      right: isHebrew ? `${leftOffset}px` : 'auto',
                      fontSize: `${fontSize}px`,
                      lineHeight,
                      maxWidth: 'calc(100vw - 40px)'
                    }}
                  >
                    {chordPos.chord}
                  </button>
                );
              })}
            </div>
            {/* Lyrics line */}
            <div className="text-gray-900 min-h-[1.8rem] w-full" style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              maxWidth: '100%'
            }}>
              {wrappedLine.lyrics}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

WrappedChordLyricsLine.displayName = 'WrappedChordLyricsLine';

// Chord Diagrams Grid Component
interface ChordDiagramsGridProps {
  song: any;
  onChordClick: (chord: string) => void;
  fontSize: number;
}

function ChordDiagramsGrid({ song, onChordClick, fontSize }: ChordDiagramsGridProps) {
  // Import extractAllChords function
  const { extractAllChords } = require('@/utils/structuredSong');
  const allChords = extractAllChords(song);
  
  if (allChords.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        Aucun accord détecté dans cette chanson
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4">
      {allChords.map((chord: string) => (
        <button
          key={chord}
          onClick={() => onChordClick(chord)}
          className="group p-1.5 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        >
          <div className="text-center w-full">
            <div 
              className="font-bold text-gray-900 group-hover:text-blue-600 w-full text-center" 
              style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
              title={chord}
            >
              {chord}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
