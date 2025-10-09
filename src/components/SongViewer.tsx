'use client';

import { useApp } from '@/context/AppContext';
import { Song, SongEditData } from '@/types';
import { extractAllChords, renderStructuredSong, transposeStructuredSong } from '@/utils/structuredSong';
import {
  getOptimalLineHeight,
  getResponsiveFontSize,
  needsWrapping,
  wrapLyricsWithChords,
  type TextMeasurementOptions
} from '@/utils/textMeasurement';
import {
  ArrowLeftIcon,
  EyeIcon,
  MinusIcon,
  MusicalNoteIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import ChordDiagram from './ChordDiagram';

interface SongViewerProps {
  song: Song;
}

export default function SongViewer({ song }: SongViewerProps) {
  const {
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
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordDiagram, setShowChordDiagram] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState(14); // Default font size in px
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (song) {
      // Convert structured song back to raw text for editing
      setEditContent(renderStructuredSong(song));
    }
  }, [song]);

  // Auto-scroll functionality
  useEffect(() => {

    
    if (autoScroll.isActive && contentRef.current) {
     
      
      scrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          const scrollAmount = autoScroll.speed * 1; // Use speed directly
          const oldScrollTop = contentRef.current.scrollTop;
          const maxScrollTop = contentRef.current.scrollHeight - contentRef.current.clientHeight;
          
      
          
          // Check if there's content to scroll
          if (maxScrollTop <= 0) {
            toggleAutoScroll();
            return;
          }
          
          // Scroll down
          contentRef.current.scrollTop += scrollAmount;
          
          // Stop if reached bottom (with small tolerance)
          const tolerance = 5;
          const isAtBottom = contentRef.current.scrollTop >= maxScrollTop - tolerance;
          
          if (isAtBottom) {
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
        scrollIntervalRef.current = null;
      }
    };
  }, [autoScroll.isActive, autoScroll.speed, toggleAutoScroll]);

  if (!song) {
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Extraire le titre et l'auteur du contenu édité
      const lines = editContent.split('\n');
      let title = song.title;
      let author = song.author;
      let content = editContent;

      // Essayer d'extraire le titre et l'auteur des premières lignes
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine && !firstLine.startsWith('[') && !firstLine.startsWith('{')) {
          title = firstLine;
        }
      }

      // Chercher une ligne qui commence par "Par " ou "By " pour l'auteur
      const authorLine = lines.find(line => 
        line.trim().toLowerCase().startsWith('par ') || 
        line.trim().toLowerCase().startsWith('by ')
      );
      if (authorLine) {
        author = authorLine.replace(/^(par |by )/i, '').trim();
      }

      // Appeler l'API pour mettre à jour la chanson
      const songEditData: SongEditData = {
        title,
        author,
        content,
        folderId: song.folderId
      };
      
      await updateSong(song.id, songEditData);

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving song:', error);
      alert('Erreur lors de la sauvegarde de la chanson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(song.id);
      router.push('/');
    }
  };

  const handleChordClick = (chord: string) => {
    setSelectedChord(chord);
    setShowChordDiagram(true);
  };

  const handleToggleAutoScroll = () => {
    toggleAutoScroll();
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)); // Max 24px
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10)); // Min 10px
  };

  const resetFontSize = () => {
    setFontSize(14); // Reset to default
  };

  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // All songs are now structured format - use structured rendering
  const transposedSong = transposeStructuredSong(song, transposeValue);
  const transposedContent = renderStructuredSong(transposedSong, {
    maxWidth: 80,
    wordWrap: true,
    isMobile: window.innerWidth < 768
  });

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
      {/* Header - Mobile Responsive */}
      <div className="flex-shrink-0 border-b border-gray-200">
        {/* Mobile Header */}
        <div className="block md:hidden w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between p-3 gap-2 w-full max-w-full">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="flex-1 text-center px-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-full" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>{song.title}</h1>
              {song.author && (
                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-full" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>Par {song.author}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
            >
              <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Mobile Controls */}
          <div className="px-3 pb-3 space-y-3 w-full max-w-full overflow-hidden">
            {/* Instrument Toggle - Mobile */}
            <div className="flex rounded-md shadow-sm w-full max-w-full">
              <button
                onClick={() => setSelectedInstrument('piano')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-l-md border ${
                  selectedInstrument === 'piano'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎹 Piano
              </button>
              <button
                onClick={() => setSelectedInstrument('guitar')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-r-md border-t border-r border-b ${
                  selectedInstrument === 'guitar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎸 Guitare
              </button>
            </div>

             {/* Controls Row - Mobile */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-full">
               {/* Transpose Controls */}
               <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 rounded-lg px-2 sm:px-3 py-2 flex-1 min-w-0">
                 <span className="text-xs text-gray-600 whitespace-nowrap">Ton:</span>
                 <button
                   onClick={() => setTransposeValue(Math.max(transposeValue - 1, -11))}
                   disabled={transposeValue <= -11}
                   className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded flex-shrink-0"
                 >
                   <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
                 <span className="text-xs sm:text-sm font-medium min-w-[2rem] text-center">
                   {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                 </span>
                 <button
                   onClick={() => setTransposeValue(Math.min(transposeValue + 1, 11))}
                   disabled={transposeValue >= 11}
                   className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded flex-shrink-0"
                 >
                   <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
               </div>

               {/* Auto-scroll Controls */}
               <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-2 flex-1 min-w-0">
                 <button
                   onClick={handleToggleAutoScroll}
                   className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                     autoScroll.isActive
                       ? 'bg-green-100 text-green-600'
                       : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                   }`}
                   title={autoScroll.isActive ? 'Arrêter' : 'Démarrer'}
                 >
                   {autoScroll.isActive ? (
                     <PauseIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                   ) : (
                     <PlayIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                   )}
                 </button>
                 
                 <button
                   onClick={() => setAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                   className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded flex-shrink-0"
                   title="Ralentir"
                 >
                   <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
                 
                 <span className="text-xs text-gray-600 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                   {autoScroll.speed.toFixed(1)}x
                 </span>
                 
                 <button
                   onClick={() => setAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                   className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded flex-shrink-0"
                   title="Accélérer"
                 >
                   <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
                 
                 <button
                   onClick={resetScroll}
                   className="text-xs text-gray-500 hover:text-gray-700 px-1.5 sm:px-2 py-1 rounded bg-white flex-shrink-0"
                   title="Haut"
                 >
                   ↑
                 </button>
               </div>
             </div>

             {/* Font Size Controls - Mobile */}
             <div className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 w-full max-w-full">
               <span className="text-xs sm:text-sm font-medium text-blue-700 whitespace-nowrap">Taille:</span>
               <div className="flex items-center space-x-1 flex-1 justify-center">
                 <button
                   onClick={decreaseFontSize}
                   disabled={fontSize <= 10}
                   className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0"
                   title="Réduire la taille"
                 >
                   <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
                 <span className="text-xs sm:text-sm font-bold text-blue-800 bg-blue-100 px-2 sm:px-3 py-1 rounded min-w-[2.5rem] sm:min-w-[3rem] text-center">
                   {fontSize}px
                 </span>
                 <button
                   onClick={increaseFontSize}
                   disabled={fontSize >= 24}
                   className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0"
                   title="Augmenter la taille"
                 >
                   <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
                 <button
                   onClick={resetFontSize}
                   className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
                   title="Taille par défaut"
                 >
                   <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                 </button>
               </div>
             </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>{song.title}</h1>
              {song.author && (
                <p className="text-sm text-gray-600" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>Par {song.author}</p>
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
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <button
                onClick={handleToggleAutoScroll}
                className={`p-2 rounded-full ${
                  autoScroll.isActive
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                }`}
                title={autoScroll.isActive ? 'Arrêter le défilement' : 'Démarrer le défilement'}
              >
                {autoScroll.isActive ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={() => setAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
                title="Ralentir"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              
              <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                {autoScroll.speed.toFixed(1)}x
              </span>
              
              <button
                onClick={() => setAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
                title="Accélérer"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={resetScroll}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-white"
                title="Remonter en haut"
              >
                ↑ Haut
              </button>
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= 10}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Réduire la taille"
              >
                <MinusIcon className="h-3 sm:h-4 w-3 sm:w-4" />
              </button>
              <span className="hidden sm:block text-xs font-medium min-w-[2rem] text-center text-gray-600">
                {fontSize}px
              </span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= 24}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Augmenter la taille"
              >
                <PlusIcon className="h-3 sm:h-4 w-3 sm:w-4" />
              </button>
              <button
                onClick={resetFontSize}
                className="p-1 text-gray-400 hover:text-gray-600 ml-1"
                title="Taille par défaut"
              >
                <EyeIcon className="h-3 sm:h-4 w-3 sm:w-4" />
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
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
                    setEditContent(renderStructuredSong(song));
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 bg-gray-50 min-h-0"
              style={{ 
                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                maxHeight: 'calc(100vh - 200px)', // Ensure scrollable area
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
                  <ChordDiagramsGrid song={transposedSong} onChordClick={handleChordClick} fontSize={fontSize} />
                </div>

                {/* Song Content */}
                <StructuredSongContent 
                  song={transposedSong} 
                  onChordClick={handleChordClick}
                  fontSize={fontSize}
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
                  onClick={() => setShowChordDiagram(false)}
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
    // More accurate calculation based on actual monospace font metrics
    // Monaco/Lucida Console have different character widths
    return fontSize * 0.58; // Adjusted for better accuracy
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
      
      {song.sections.map((section: any, sectionIndex: number) => (
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
      ))}
    </div>
  );
}

// New component for precise chord-over-lyrics alignment
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
  song: any; // StructuredSong type
  onChordClick: (chord: string) => void;
  fontSize: number;
}

function ChordDiagramsGrid({ song, onChordClick, fontSize }: ChordDiagramsGridProps) {
  const allChords = extractAllChords(song);
  
  if (allChords.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        Aucun accord détecté dans cette chanson
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {allChords.map((chord) => (
        <button
          key={chord}
          onClick={() => onChordClick(chord)}
          className="group p-2 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
