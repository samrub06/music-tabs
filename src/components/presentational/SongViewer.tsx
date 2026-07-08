'use client';

import { Song, Chord, SongLine, SongSection } from '@/types';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import React, { RefObject, useEffect, useState } from 'react';
import SongHeader from './SongHeader';
import SongContent from './SongContent';
import ToolsBottomBar from './ToolsBottomBar';
import FloatingYoutubeTutorial from './FloatingYoutubeTutorial';
import type { Folder } from '@/types';
import type { NextSongRef } from './SongEndSuggestions';

const ChordDiagramModal = dynamic(() => import('./ChordDiagramModal'), { ssr: false });

interface SongViewerProps {
  song: Song;
  transposedSong: any;
  transposedContent: string;
  isEditing: boolean;
  editSections: SongSection[];
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
  onUpdateLine: (sectionIndex: number, lineIndex: number, line: SongLine) => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onAddLine: (sectionIndex: number, lineType: SongLine['type']) => void;
  onDeleteLine: (sectionIndex: number, lineIndex: number) => void;
  onMoveLine: (sectionIndex: number, lineIndex: number, direction: 'up' | 'down') => void;
  onSave: () => void;
  onDelete?: () => void;
  onChordClick: (chord: string) => void;
  onToggleAutoScroll: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onResetScroll: () => void;
  onCancelEdit: () => void;
  onToggleEdit?: () => void;
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
  onPlayNext?: () => void;
  onReachSongEnd?: () => void;
  canAwardOnEndReach?: boolean;
  isAuthenticated?: boolean;
  manualBpm?: number | null;
  onSetManualBpm?: (bpm: number) => void;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[];
  isInLibrary?: boolean;
  isOwnedByUser?: boolean;
  librarySongId?: string;
  isLiked?: boolean;
  onAddToLibrary?: () => void;
  isAddingToLibrary?: boolean;
  onRemoveFromLibrary?: () => void;
  isRemovingFromLibrary?: boolean;
  libraryActionFeedback?: { type: 'success' | 'error'; message: string } | null;
  onToggleFavorite?: () => void;
  isTogglingFavorite?: boolean;
  onFontSizeChange?: (value: number) => void;
  bottomBarHeight?: number;
  setBottomBarHeight?: (height: number) => void;
  onToggleToolsBar?: () => void;
  folders?: Folder[];
  currentFolderId?: string;
  onFolderChange?: (folderId: string | undefined) => Promise<void>;
}

export default function SongViewer({
  song,
  transposedSong,
  transposedContent,
  isEditing,
  editSections,
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
  onUpdateLine,
  onAddSection,
  onDeleteSection,
  onAddLine,
  onDeleteLine,
  onMoveLine,
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
    onPlayNext,
    onReachSongEnd,
    canAwardOnEndReach,
    isAuthenticated = false,
    manualBpm,
    onSetManualBpm,
    easyChordMode,
    onToggleEasyChordMode,
    knownChordIds = new Set(),
    chordNameToIdMap = new Map(),
    chords = [],
    isInLibrary,
    isOwnedByUser,
    librarySongId,
    isLiked,
    onAddToLibrary,
    isAddingToLibrary,
    onRemoveFromLibrary,
    isRemovingFromLibrary,
    libraryActionFeedback,
    onToggleFavorite,
    isTogglingFavorite,
    onFontSizeChange,
    bottomBarHeight = 0,
    setBottomBarHeight,
    onToggleToolsBar,
    folders = [],
    currentFolderId,
    onFolderChange,
}: SongViewerProps) {
  const [youtubeTutorialOpen, setYoutubeTutorialOpen] = useState(false);

  useEffect(() => {
    setYoutubeTutorialOpen(false);
  }, [song?.id]);

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
        isInLibrary={isInLibrary}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <SongContent
              isEditing={isEditing}
              editSections={editSections}
              transposedSong={transposedSong}
              transposedContent={transposedContent}
              fontSize={fontSize}
              contentRef={contentRef}
              isSaving={isSaving}
              onUpdateLine={onUpdateLine}
              onAddSection={onAddSection}
              onDeleteSection={onDeleteSection}
              onAddLine={onAddLine}
              onDeleteLine={onDeleteLine}
              onMoveLine={onMoveLine}
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
              librarySongId={librarySongId}
              isLiked={isLiked}
              onAddToLibrary={onAddToLibrary}
              isAddingToLibrary={isAddingToLibrary}
              onRemoveFromLibrary={onRemoveFromLibrary}
              isRemovingFromLibrary={isRemovingFromLibrary}
              libraryActionFeedback={libraryActionFeedback}
              onToggleFavorite={onToggleFavorite}
              isTogglingFavorite={isTogglingFavorite}
              selectedInstrument={selectedInstrument}
              onSetSelectedInstrument={onSetSelectedInstrument}
              transposeValue={transposeValue}
              onSetTransposeValue={onSetTransposeValue}
              easyChordMode={easyChordMode}
              onToggleEasyChordMode={onToggleEasyChordMode}
              nextSong={nextSongInfo}
              onPlayNext={onPlayNext}
              onReachSongEnd={onReachSongEnd}
              canAwardOnEndReach={canAwardOnEndReach}
              folders={folders}
              currentFolderId={currentFolderId}
              onFolderChange={onFolderChange}
              youtubeTutorialOpen={youtubeTutorialOpen}
              onToggleYoutubeTutorial={() => setYoutubeTutorialOpen((prev) => !prev)}
            />
          </div>

          {showChordDiagram && selectedChord && (
            <ChordDiagramModal
              selectedChord={selectedChord}
              selectedInstrument={selectedInstrument}
              fontSize={fontSize}
              onClose={onCloseChordDiagram}
              isAuthenticated={isAuthenticated}
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

      <FloatingYoutubeTutorial
        songTitle={song.title}
        songAuthor={song.author}
        selectedInstrument={selectedInstrument}
        isOpen={youtubeTutorialOpen}
        onClose={() => setYoutubeTutorialOpen(false)}
      />
    </div>
  );
}
