'use client';

import { Song, Chord } from '@/types';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import React, { RefObject } from 'react';
import SongHeader from './SongHeader';
import SongContent from './SongContent';
import ChordDiagramModal from './ChordDiagramModal';
import ToolsBottomBar from './ToolsBottomBar';

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
  metronome: {
    isActive: boolean;
    bpm: number | null;
  };
  onToggleMetronome: () => void;
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
  easyChordMode: boolean;
  onToggleEasyChordMode: () => void;
  useCapo: boolean;
  onToggleCapo: (value: boolean) => void;
  onNavigateBack: () => void;
  onPrevSong?: () => void;
  onNextSong?: () => void;
  canPrevSong?: boolean;
  canNextSong?: boolean;
  nextSongInfo?: { title: string; author?: string } | null;
  isAuthenticated?: boolean;
  manualBpm?: number | null;
  onSetManualBpm?: (bpm: number) => void;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[];
  isInLibrary?: boolean;
  onAddToLibrary?: () => void;
  onFontSizeChange?: (value: number) => void;
  bottomBarHeight?: number;
  setBottomBarHeight?: (height: number) => void;
  onToggleToolsBar?: () => void;
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
  metronome,
  onToggleMetronome,
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
  useCapo,
  onToggleCapo,
  onNavigateBack,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong,
    nextSongInfo,
    isAuthenticated = false,
    manualBpm,
    onSetManualBpm,
    easyChordMode,
    onToggleEasyChordMode,
    knownChordIds = new Set(),
    chordNameToIdMap = new Map(),
    chords = [],
    isInLibrary,
    onAddToLibrary,
    onFontSizeChange,
    bottomBarHeight = 0,
    setBottomBarHeight,
    onToggleToolsBar,
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
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      {/* Header */}
      <SongHeader
        song={song}
        selectedInstrument={selectedInstrument}
        transposeValue={transposeValue}
        autoScroll={autoScroll}
        fontSize={fontSize}
        useCapo={useCapo}
        onToggleCapo={onToggleCapo}
        onNavigateBack={onNavigateBack}
        onToggleEdit={onToggleEdit}
        onDelete={onDelete}
        onSetSelectedInstrument={onSetSelectedInstrument}
        onSetTransposeValue={onSetTransposeValue}
        onToggleAutoScroll={onToggleAutoScroll}
        onSetAutoScrollSpeed={onSetAutoScrollSpeed}
        metronome={metronome}
        onToggleMetronome={onToggleMetronome}
        onResetScroll={onResetScroll}
        onIncreaseFontSize={onIncreaseFontSize}
        onDecreaseFontSize={onDecreaseFontSize}
        onResetFontSize={onResetFontSize}
        onPrevSong={onPrevSong}
        onNextSong={onNextSong}
        canPrevSong={!!canPrevSong}
        canNextSong={!!canNextSong}
        nextSongInfo={nextSongInfo}
        manualBpm={manualBpm}
        onSetManualBpm={onSetManualBpm}
        easyChordMode={easyChordMode}
        onToggleEasyChordMode={onToggleEasyChordMode}
        isInLibrary={isInLibrary}
        onAddToLibrary={onAddToLibrary}
        onToggleToolsBar={onToggleToolsBar}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
              isAuthenticated={isAuthenticated}
              autoScrollIsActive={autoScroll.isActive}
              bpm={manualBpm || song.bpm || undefined}
              knownChordIds={knownChordIds}
              chordNameToIdMap={chordNameToIdMap}
              chords={chords}
              onFontSizeChange={onFontSizeChange}
            />
          </div>

          {showChordDiagram && selectedChord && (
            <ChordDiagramModal
              selectedChord={selectedChord}
              selectedInstrument={selectedInstrument}
              fontSize={fontSize}
              onClose={onCloseChordDiagram}
              chords={chords}
            />
          )}
        </div>

        {bottomBarHeight > 0 && setBottomBarHeight && (
          <ToolsBottomBar
            song={song}
            selectedInstrument={selectedInstrument}
            transposeValue={transposeValue}
            fontSize={fontSize}
            useCapo={useCapo}
            easyChordMode={easyChordMode}
            height={bottomBarHeight}
            onHeightChange={setBottomBarHeight}
            onClose={() => setBottomBarHeight(0)}
            onSetSelectedInstrument={onSetSelectedInstrument}
            onSetTransposeValue={onSetTransposeValue}
            onToggleCapo={onToggleCapo}
            onIncreaseFontSize={onIncreaseFontSize}
            onDecreaseFontSize={onDecreaseFontSize}
            onResetFontSize={onResetFontSize}
            onToggleEasyChordMode={onToggleEasyChordMode}
            onToggleEdit={onToggleEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
