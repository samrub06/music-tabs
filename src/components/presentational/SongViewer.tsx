'use client';

import { Song, Chord, SongLine, SongSection, type SongLyricSync } from '@/types';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SongHeader from './SongHeader';
import SongContent from './SongContent';
import ToolsBottomBar from './ToolsBottomBar';
import FloatingYoutubeTutorial from './FloatingYoutubeTutorial';
import SongQueueSheet from './SongQueueSheet';
import type { Folder } from '@/types';
import type { NextSongRef } from './SongEndSuggestions';
import type { YoutubeVideoMode } from '@/utils/youtubeTutorial';
import { isLyricPracticeYoutubeMode } from '@/utils/youtubeTutorial';
import type { YoutubePlayerHandle } from '@/lib/youtube/iframeApi';
import { getLyricSyncAction, ensureLyricSyncAction, hasReadyLyricSyncAction } from '@/app/song/[id]/lyricSyncActions';
import { buildLyricSyncLookup, pickPracticeTutorialLyricLines } from '@/utils/lyricSync';
import { useLanguage } from '@/context/LanguageContext';
import {
  PracticeTutorialCoach,
  type PracticeTutorialStep,
} from '@/components/practice/PracticeTutorialCoach';

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
  const { t } = useLanguage();
  const [youtubeTutorialOpen, setYoutubeTutorialOpen] = useState(false);
  const [youtubeVideoMode, setYoutubeVideoMode] = useState<YoutubeVideoMode>('tutorial');
  const [songQueueOpen, setSongQueueOpen] = useState(false);
  const youtubePlayerApiRef = useRef<YoutubePlayerHandle | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubePlayerReady, setYoutubePlayerReady] = useState(false);
  const [lyricSync, setLyricSync] = useState<SongLyricSync | null>(null);
  const [lyricSyncLoading, setLyricSyncLoading] = useState(false);
  const [activeLyricKey, setActiveLyricKey] = useState<string | null>(null);
  const [hasLyricPractice, setHasLyricPractice] = useState(false);
  const [practiceTutorialStep, setPracticeTutorialStep] = useState<PracticeTutorialStep>(null);
  const [practiceTutorialLineKey, setPracticeTutorialLineKey] = useState<string | null>(null);
  const [practiceTutorialAwaitingSync, setPracticeTutorialAwaitingSync] = useState(false);
  const practiceAutoStartedRef = useRef(false);

  useEffect(() => {
    setYoutubeTutorialOpen(false);
    setYoutubeVideoMode('tutorial');
    setSongQueueOpen(false);
    setYoutubeVideoId(null);
    setYoutubePlayerReady(false);
    setLyricSync(null);
    setActiveLyricKey(null);
    setHasLyricPractice(false);
    setPracticeTutorialStep(null);
    setPracticeTutorialLineKey(null);
    setPracticeTutorialAwaitingSync(false);
    practiceAutoStartedRef.current = false;
  }, [song?.id]);

  useEffect(() => {
    if (!song?.id) return
    let cancelled = false
    void hasReadyLyricSyncAction({ songId: song.id }).then(({ available }) => {
      if (!cancelled) setHasLyricPractice(available)
    }).catch(() => {
      if (!cancelled) setHasLyricPractice(false)
    })
    return () => {
      cancelled = true
    }
  }, [song?.id]);

  const practiceLyricSyncEnabled =
    youtubeTutorialOpen && isLyricPracticeYoutubeMode(youtubeVideoMode) && !!youtubeVideoId;

  useEffect(() => {
    if (!practiceLyricSyncEnabled || !song?.id || !youtubeVideoId) {
      setLyricSync(null);
      setLyricSyncLoading(false);
      return;
    }

    let cancelled = false;
    setLyricSyncLoading(true);

    void (async () => {
      try {
        const { sync } = await getLyricSyncAction({
          songId: song.id,
          youtubeVideoId,
        });
        if (cancelled) return;

        if (sync?.status === 'ready') {
          setLyricSync(sync);
          setLyricSyncLoading(false);
          return;
        }

        const ensured = await ensureLyricSyncAction({
          songId: song.id,
          youtubeVideoId,
        });
        if (cancelled) return;
        setLyricSync(ensured.sync);
        setLyricSyncLoading(ensured.sync?.status === 'pending');
      } catch {
        if (!cancelled) {
          setLyricSync(null);
          setLyricSyncLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [practiceLyricSyncEnabled, song?.id, youtubeVideoId]);

  // Poll while pending
  useEffect(() => {
    if (!lyricSyncLoading || !song?.id || !youtubeVideoId) return;
    const id = window.setInterval(() => {
      void getLyricSyncAction({ songId: song.id, youtubeVideoId }).then(({ sync }) => {
        if (!sync) return;
        setLyricSync(sync);
        if (sync.status === 'ready' || sync.status === 'failed') {
          setLyricSyncLoading(false);
        }
      });
    }, 2500);
    return () => window.clearInterval(id);
  }, [lyricSyncLoading, song?.id, youtubeVideoId]);

  // Highlight current line from YouTube time (paused during line-step coachmark)
  useEffect(() => {
    if (practiceTutorialStep === 'line' && practiceTutorialLineKey) {
      setActiveLyricKey(practiceTutorialLineKey);
      return;
    }
    if (!practiceLyricSyncEnabled || lyricSync?.status !== 'ready' || !youtubePlayerReady) {
      setActiveLyricKey(null);
      return;
    }
    const timed = lyricSync.lines.filter((l) => l.startSec != null);
    if (timed.length === 0) return;

    const id = window.setInterval(() => {
      const t = youtubePlayerApiRef.current?.getCurrentTime() ?? 0;
      let current: string | null = null;
      for (let i = 0; i < timed.length; i++) {
        const line = timed[i];
        const next = timed[i + 1];
        const start = line.startSec!;
        const end = line.endSec ?? next?.startSec ?? start + 8;
        if (t >= start && t < end) {
          current = `${line.sectionIndex}:${line.lineIndex}`;
          break;
        }
      }
      setActiveLyricKey(current);
    }, 200);
    return () => window.clearInterval(id);
  }, [
    practiceLyricSyncEnabled,
    lyricSync,
    youtubePlayerReady,
    practiceTutorialStep,
    practiceTutorialLineKey,
  ]);

  const lyricSyncLookup = useMemo(
    () => buildLyricSyncLookup(lyricSync?.status === 'ready' ? lyricSync.lines : []),
    [lyricSync]
  );

  const handleLyricLineSeek = useCallback(
    (sectionIndex: number, lineIndex: number) => {
      const line = lyricSyncLookup.get(`${sectionIndex}:${lineIndex}`);
      if (line?.startSec == null) return;
      youtubePlayerApiRef.current?.seekTo(line.startSec);
      if (practiceTutorialStep === 'line') {
        setPracticeTutorialStep(null);
        setPracticeTutorialLineKey(null);
        setPracticeTutorialAwaitingSync(false);
      }
    },
    [lyricSyncLookup, practiceTutorialStep]
  );

  const endPracticeTutorial = useCallback(() => {
    setPracticeTutorialStep(null);
    setPracticeTutorialLineKey(null);
    setPracticeTutorialAwaitingSync(false);
  }, []);

  const goToPracticeLineStep = useCallback(() => {
    if (!youtubePlayerReady || lyricSync?.status !== 'ready') return false;
    const lyricTimed = pickPracticeTutorialLyricLines(lyricSync.lines);
    if (lyricTimed.length === 0) {
      endPracticeTutorial();
      return true;
    }
    // Step 2: second real lyric line (skip tabs/patterns), seek so music matches the frame.
    const target = lyricTimed[Math.min(1, lyricTimed.length - 1)];
    const key = `${target.sectionIndex}:${target.lineIndex}`;
    if (target.startSec != null) {
      youtubePlayerApiRef.current?.seekTo(target.startSec);
    }
    setPracticeTutorialLineKey(key);
    setActiveLyricKey(key);
    setPracticeTutorialStep('line');
    setPracticeTutorialAwaitingSync(false);
    return true;
  }, [lyricSync, youtubePlayerReady, endPracticeTutorial]);

  const handleSelectYoutubeMode = (mode: YoutubeVideoMode) => {
    if (youtubeTutorialOpen && youtubeVideoMode === mode) {
      setYoutubeTutorialOpen(false);
      endPracticeTutorial();
      return;
    }
    setYoutubeVideoMode(mode);
    setYoutubeTutorialOpen(true);
  };

  const handleStartLyricPracticeTutorial = useCallback(() => {
    setYoutubeVideoMode('original');
    setYoutubeTutorialOpen(true);
    setPracticeTutorialStep('youtube');
    setPracticeTutorialLineKey(null);
    setPracticeTutorialAwaitingSync(false);
  }, []);

  // Explorer “Try it” → open Original + coachmark tutorial (no loading overlay).
  useEffect(() => {
    if (practiceAutoStartedRef.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('practice') !== '1') return;
    if (!hasLyricPractice) return;

    practiceAutoStartedRef.current = true;
    handleStartLyricPracticeTutorial();

    try {
      params.delete('practice');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    } catch {
      // ignore
    }
  }, [hasLyricPractice, handleStartLyricPracticeTutorial]);

  const handlePracticeTutorialNext = useCallback(() => {
    if (practiceTutorialStep === 'youtube') {
      if (goToPracticeLineStep()) return;
      setPracticeTutorialAwaitingSync(true);
      return;
    }
    if (practiceTutorialStep === 'line' && practiceTutorialLineKey) {
      const [sectionRaw, lineRaw] = practiceTutorialLineKey.split(':');
      const sectionIndex = Number(sectionRaw);
      const lineIndex = Number(lineRaw);
      if (Number.isFinite(sectionIndex) && Number.isFinite(lineIndex)) {
        handleLyricLineSeek(sectionIndex, lineIndex);
      }
      endPracticeTutorial();
    }
  }, [
    practiceTutorialStep,
    practiceTutorialLineKey,
    goToPracticeLineStep,
    handleLyricLineSeek,
    endPracticeTutorial,
  ]);

  // After "Next" on video step, advance once lyric sync is ready.
  useEffect(() => {
    if (!practiceTutorialAwaitingSync) return;
    if (practiceTutorialStep !== 'youtube') return;
    goToPracticeLineStep();
  }, [
    practiceTutorialAwaitingSync,
    practiceTutorialStep,
    lyricSync,
    youtubePlayerReady,
    goToPracticeLineStep,
  ]);

  const practiceTutorialTargetSelector =
    practiceTutorialStep === 'youtube'
      ? '[data-practice-target="youtube-player"]'
      : practiceTutorialStep === 'line' && practiceTutorialLineKey
        ? `[data-lyric-key="${practiceTutorialLineKey}"]`
        : null;

  const syncBanner = (() => {
    if (!isLyricPracticeYoutubeMode(youtubeVideoMode)) return null;
    if (lyricSyncLoading || lyricSync?.status === 'pending') {
      return t('songContent.lyricSyncAligning');
    }
    if (lyricSync?.status === 'ready') {
      const n = lyricSync.lines.filter((l) => l.startSec != null).length;
      return t('songContent.lyricSyncReady').replace('{count}', String(n));
    }
    if (lyricSync?.status === 'failed') {
      return t('songContent.lyricSyncFailed');
    }
    if (youtubeVideoId && !lyricSyncLoading) {
      return t('songContent.lyricSyncMissing');
    }
    return null;
  })();

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
              youtubeVideoMode={youtubeVideoMode}
              onSelectYoutubeMode={handleSelectYoutubeMode}
              onOpenSongQueue={() => setSongQueueOpen(true)}
              youtubeLyricSeekEnabled={
                practiceLyricSyncEnabled && lyricSync?.status === 'ready' && youtubePlayerReady
              }
              youtubeLyricSyncLookup={lyricSyncLookup}
              youtubeActiveLyricKey={activeLyricKey}
              onYoutubeLyricLineClick={handleLyricLineSeek}
              hasLyricPractice={hasLyricPractice}
              onStartLyricPracticeTutorial={handleStartLyricPracticeTutorial}
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
        songId={song.id}
        songTitle={song.title}
        songAuthor={song.author}
        selectedInstrument={selectedInstrument}
        isOpen={youtubeTutorialOpen}
        videoMode={youtubeVideoMode}
        onClose={() => {
          setYoutubeTutorialOpen(false);
          endPracticeTutorial();
        }}
        playerApiRef={youtubePlayerApiRef}
        onVideoIdChange={setYoutubeVideoId}
        onPlayerReadyChange={setYoutubePlayerReady}
        syncBanner={syncBanner}
      />

      <PracticeTutorialCoach
        step={practiceTutorialStep}
        targetSelector={practiceTutorialTargetSelector}
        onNext={handlePracticeTutorialNext}
        onSkip={endPracticeTutorial}
      />

      <SongQueueSheet
        open={songQueueOpen}
        onOpenChange={setSongQueueOpen}
        currentSongId={song.id}
      />
    </div>
  );
}
