'use client';

import { useApp } from '@/context/AppContext';
import { isChordLine, transposeText } from '@/utils/chords';
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
      setEditContent(currentSong.content);
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
    updateSong(currentSong.id, { content: editContent });
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

  // Transpose the content
  const transposedContent = transposeText(currentSong.content, transposeValue);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
              onClick={() => setTransposeValue(Math.max(transposeValue - 1, -6))}
              disabled={transposeValue <= -6}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
            </span>
            <button
              onClick={() => setTransposeValue(Math.min(transposeValue + 1, 6))}
              disabled={transposeValue >= 6}
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
              max="3"
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
                    setEditContent(currentSong.content);
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
              className="flex-1 overflow-y-auto p-6 bg-gray-50"
            >
              <SongContent 
                content={transposedContent} 
                onChordClick={handleChordClick}
              />
            </div>
          )}
        </div>

        {/* Chord Diagram Sidebar */}
        {showChordDiagram && selectedChord && (
          <div className="w-80 border-l border-gray-200 bg-white">
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
  const lines = content.split('\n');
  
  return (
    <div className="font-mono text-sm leading-relaxed space-y-2">
      {lines.map((line, index) => (
        <div key={index} className="min-h-[1.5rem]">
          {line.trim() ? (
            <ContentLine line={line} onChordClick={onChordClick} />
          ) : (
            <div className="h-4" /> // Empty line
          )}
        </div>
      ))}
    </div>
  );
}

interface ContentLineProps {
  line: string;
  onChordClick: (chord: string) => void;
}

function ContentLine({ line, onChordClick }: ContentLineProps) {
  // Check if this is a section header (e.g., [Verse], [Chorus])
  if (line.match(/^\[.*\]$/)) {
    return (
      <div className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">
        {line}
      </div>
    );
  }

  // Check if this is primarily a chord line
  if (isChordLine(line)) {
    return <ChordLine line={line} onChordClick={onChordClick} />;
  }

  // Regular lyrics line
  return <div className="text-gray-900">{line}</div>;
}

interface ChordLineProps {
  line: string;
  onChordClick: (chord: string) => void;
}

function ChordLine({ line, onChordClick }: ChordLineProps) {
  // Split line into chord and non-chord parts
  const chordPattern = /\b([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = chordPattern.exec(line)) !== null) {
    // Add text before chord
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: line.slice(lastIndex, match.index)
      });
    }
    
    // Add chord
    parts.push({
      type: 'chord',
      content: match[1]
    });
    
    lastIndex = chordPattern.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < line.length) {
    parts.push({
      type: 'text',
      content: line.slice(lastIndex)
    });
  }

  return (
    <div className="text-blue-600 font-semibold">
      {parts.map((part, index) => (
        part.type === 'chord' ? (
          <button
            key={index}
            onClick={() => onChordClick(part.content)}
            className="hover:bg-blue-100 hover:text-blue-800 px-1 rounded transition-colors cursor-pointer underline"
            title={`Voir le diagramme de ${part.content}`}
          >
            {part.content}
          </button>
        ) : (
          <span key={index}>{part.content}</span>
        )
      ))}
    </div>
  );
}
