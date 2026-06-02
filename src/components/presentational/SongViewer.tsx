'use client';

import { Song, Chord } from '@/types';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import React, { RefObject } from 'react';
import SongHeader from './SongHeader';
import SongContent from './SongContent';
import ChordDiagramModal from './ChordDiagramModal';
import ToolsBottomBar from './ToolsBottomBar';
import type { LibrarySongRef } from '@/utils/songSuggestions';
import type { NextSongRef } from './SongEndSuggestions';

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
  nextSongInfo?: NextSongRef | null;
  librarySongs?: LibrarySongRef[];
  onPlayNext?: () => void;
  isAuthenticated?: boolean;
  manualBpm?: number | null;
  onSetManualBpm?: (bpm: number) => void;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[];
  isInLibrary?: boolean;
  isLiked?: boolean;
  onAddToLibrary?: () => void;
  onToggleFavorite?: () => void;
  isTogglingFavorite?: boolean;
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
    librarySongs = [],
    onPlayNext,
    isAuthenticated = false,
    manualBpm,
    onSetManualBpm,
    easyChordMode,
    onToggleEasyChordMode,
    knownChordIds = new Set(),
    chordNameToIdMap = new Map(),
    chords = [],
    isInLibrary,
    isLiked,
    onAddToLibrary,
    onToggleFavorite,
    isTogglingFavorite,
    onFontSizeChange,
    bottomBarHeight = 0,
    setBottomBarHeight,
    onToggleToolsBar,
}: SongViewerProps) {
  if (!song) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">
            Aucune chanson sélectionnée
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisissez une chanson dans la liste pour la visualiser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen md:min-h-0 bg-background overflow-hidden">
      {/* Header */}
      <SongHeader
        song={song}
        autoScroll={autoScroll}
        onNavigateBack={onNavigateBack}
        onToggleAutoScroll={onToggleAutoScroll}
        onSetAutoScrollSpeed={onSetAutoScrollSpeed}
        onResetScroll={onResetScroll}
        onPrevSong={onPrevSong}
        onNextSong={onNextSong}
        canPrevSong={!!canPrevSong}
        canNextSong={!!canNextSong}
        nextSongInfo={nextSongInfo}
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
              onToggleEdit={onToggleEdit}
              isInLibrary={isInLibrary}
              isLiked={isLiked}
              onAddToLibrary={onAddToLibrary}
              onToggleFavorite={onToggleFavorite}
              isTogglingFavorite={isTogglingFavorite}
              selectedInstrument={selectedInstrument}
              onSetSelectedInstrument={onSetSelectedInstrument}
              transposeValue={transposeValue}
              onSetTransposeValue={onSetTransposeValue}
              easyChordMode={easyChordMode}
              onToggleEasyChordMode={onToggleEasyChordMode}
              librarySongs={librarySongs}
              nextSong={nextSongInfo}
              onPlayNext={onPlayNext}
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
