'use client';

import { Song } from '@/types';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import React, { RefObject } from 'react';
import SongHeader from './SongHeader';
import SongContent from './SongContent';
import ChordDiagramModal from './ChordDiagramModal';

interface SongViewerProps {
  song: Song;
  transposedSong: any;
  transposedContent: string;
  isEditing: boolean;
  editContent: string;
  selectedChord: string | null;
  showChordDiagram: boolean;
  isSaving: boolean;
  fontSize: number;
  selectedInstrument: 'piano' | 'guitar';
  transposeValue: number;
  autoScroll: {
    isActive: boolean;
    speed: number;
  };
  contentRef: RefObject<HTMLDivElement>;
  onEditContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onChordClick: (chord: string) => void;
  onToggleAutoScroll: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onResetScroll: () => void;
  onCancelEdit: () => void;
  onToggleEdit: () => void;
  onCloseChordDiagram: () => void;
  onSetSelectedInstrument: (instrument: 'piano' | 'guitar') => void;
  onSetTransposeValue: (value: number) => void;
  onSetAutoScrollSpeed: (speed: number) => void;
  onNavigateBack: () => void;
}

export default function SongViewer({
  song,
  transposedSong,
  transposedContent,
  isEditing,
  editContent,
  selectedChord,
  showChordDiagram,
  isSaving,
  fontSize,
  selectedInstrument,
  transposeValue,
  autoScroll,
  contentRef,
  onEditContentChange,
  onSave,
  onDelete,
  onChordClick,
  onToggleAutoScroll,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  onResetScroll,
  onCancelEdit,
  onToggleEdit,
  onCloseChordDiagram,
  onSetSelectedInstrument,
  onSetTransposeValue,
  onSetAutoScrollSpeed,
  onNavigateBack
}: SongViewerProps) {
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

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
      {/* Header */}
      <SongHeader
        song={song}
        selectedInstrument={selectedInstrument}
        transposeValue={transposeValue}
        autoScroll={autoScroll}
        fontSize={fontSize}
        onNavigateBack={onNavigateBack}
        onToggleEdit={onToggleEdit}
        onDelete={onDelete}
        onSetSelectedInstrument={onSetSelectedInstrument}
        onSetTransposeValue={onSetTransposeValue}
        onToggleAutoScroll={onToggleAutoScroll}
        onSetAutoScrollSpeed={onSetAutoScrollSpeed}
        onResetScroll={onResetScroll}
        onIncreaseFontSize={onIncreaseFontSize}
        onDecreaseFontSize={onDecreaseFontSize}
        onResetFontSize={onResetFontSize}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <SongContent
            isEditing={isEditing}
            editContent={editContent}
            transposedSong={transposedSong}
            transposedContent={transposedContent}
            fontSize={fontSize}
            contentRef={contentRef}
            isSaving={isSaving}
            onEditContentChange={onEditContentChange}
            onSave={onSave}
            onCancelEdit={onCancelEdit}
            onChordClick={onChordClick}
          />
        </div>

        {/* Chord Diagram Modal/Sidebar */}
        {showChordDiagram && selectedChord && (
          <ChordDiagramModal
            selectedChord={selectedChord}
            selectedInstrument={selectedInstrument}
            fontSize={fontSize}
            onClose={onCloseChordDiagram}
          />
        )}
      </div>
    </div>
  );
}
