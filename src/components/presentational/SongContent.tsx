'use client';

import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  CheckIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  HeartIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { getOptimalLineHeight, getResponsiveFontSize, needsWrapping, wrapLyricsWithChords, type TextMeasurementOptions } from '@/utils/textMeasurement';
import { ChordBox } from 'vexchords';
import {
  CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS,
  CHORD_PREVIEW_DIAGRAM_OPTS,
  CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS,
} from '@/components/chords/chordCardDimensions';
import { ChordPreviewCard } from '@/components/chords/ChordPreviewCard';
import { getChordVariantGroup } from '@/utils/chordVariantLookup';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import type { ChordInstrument } from '@/components/chords/InstrumentToggle';
import type { Chord, Folder } from '@/types';
import FolderDropdown from '@/components/FolderDropdown';
import { mapChordNicknameToDbName, normalizeChordNameForComparison } from '@/utils/chords';
import { generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import { formatSectionDisplayName } from '@/utils/sectionDisplayName';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Piano, Guitar } from 'lucide-react';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SongEndSuggestions, type NextSongRef } from './SongEndSuggestions';
import type { LibrarySongRef } from '@/utils/songSuggestions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const segmentClass = 'flex rounded-full bg-muted/80 p-0.5 gap-0.5';
const segmentOptionClass = (active: boolean) =>
  cn(
    'flex-1 rounded-full px-2.5 py-1.5 min-h-9 min-w-9 text-xs font-medium transition-all duration-200 sm:px-3 sm:py-2 sm:min-h-[40px] sm:text-sm',
    active
      ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
      : 'text-muted-foreground hover:text-foreground'
  );
const toolPillClass = (active: boolean) =>
  cn(
    'shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 min-h-9 text-xs font-medium transition-all duration-200 sm:px-3 sm:py-2 sm:min-h-[40px] sm:text-sm',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
  );

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
  autoScrollIsActive?: boolean;
  bpm?: number | null;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[];
  onFontSizeChange?: (value: number) => void;
  onToggleEdit?: () => void;
  isInLibrary?: boolean;
  isLiked?: boolean;
  onAddToLibrary?: () => void;
  onToggleFavorite?: () => void;
  isTogglingFavorite?: boolean;
  selectedInstrument?: 'piano' | 'guitar';
  onSetSelectedInstrument?: (instrument: 'piano' | 'guitar') => void;
  transposeValue?: number;
  onSetTransposeValue?: (value: number) => void;
  easyChordMode?: boolean;
  onToggleEasyChordMode?: () => void;
  librarySongs?: LibrarySongRef[];
  nextSong?: NextSongRef | null;
  onPlayNext?: () => void;
  folders?: Folder[];
  currentFolderId?: string;
  onFolderChange?: (folderId: string | undefined) => Promise<void>;
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
  isAuthenticated = false,
  autoScrollIsActive = false,
  bpm,
  knownChordIds = new Set(),
  chordNameToIdMap = new Map(),
  chords = [],
  onFontSizeChange,
  onToggleEdit,
  isInLibrary = false,
  isLiked = false,
  onAddToLibrary,
  onToggleFavorite,
  isTogglingFavorite = false,
  selectedInstrument = 'piano',
  onSetSelectedInstrument,
  transposeValue = 0,
  onSetTransposeValue,
  easyChordMode = false,
  onToggleEasyChordMode,
  librarySongs = [],
  nextSong = null,
  onPlayNext,
  folders = [],
  currentFolderId,
  onFolderChange,
}: SongContentProps) {
  const { t } = useLanguage();
  const pinchRef = useRef<{ initialDistance: number; initialFontSize: number } | null>(null);
  const lastPinchTime = useRef(0);
  const onFontSizeChangeRef = useRef(onFontSizeChange);
  onFontSizeChangeRef.current = onFontSizeChange;
  const PINCH_THROTTLE_MS = 80;

  useEffect(() => {
    const el = contentRef?.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current || !onFontSizeChangeRef.current) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastPinchTime.current < PINCH_THROTTLE_MS) return;
      lastPinchTime.current = now;
      const currentDistance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      if (currentDistance === 0) return;
      const scale = currentDistance / pinchRef.current.initialDistance;
      const newSize = Math.min(24, Math.max(10, Math.round((pinchRef.current.initialFontSize * scale) / 2) * 2));
      onFontSizeChangeRef.current(newSize);
    };
    const handleTouchEnd = () => { pinchRef.current = null; };
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [contentRef]);

  const [chordSectionOpen, setChordSectionOpen] = useState(true);
  const [showTransposeControls, setShowTransposeControls] = useState(false);

  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <textarea
          value={editContent}
          onChange={(e) => onEditContentChange(e.target.value)}
          className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={t('songForm.lyrics')}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('songContent.saving') : t('songContent.save')}
          </button>
        </div>
      </div>
    );
  }

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && onFontSizeChange) {
      pinchRef.current = {
        initialDistance: getTouchDistance(e.touches),
        initialFontSize: fontSize,
      };
    }
  };

  const hasOnlyEasyChords = songHasOnlyEasyChords(transposedSong?.allChords);
  const baseChord = transposedSong?.firstChord || transposedSong?.key || 'C';
  const availableKeys = generateAllKeys(baseChord);
  const currentKey = availableKeys[(transposeValue + 12) % 12] || baseChord;

  const handleKeySelect = (targetKey: string) => {
    if (!onSetTransposeValue) return;
    const targetIndex = availableKeys.findIndex((key) => key === targetKey);
    if (targetIndex === -1) return;
    let newTransposeValue = targetIndex;
    if (newTransposeValue > 6) newTransposeValue -= 12;
    else if (newTransposeValue < -6) newTransposeValue += 12;
    onSetTransposeValue(newTransposeValue);
  };

  return (
    <div 
      ref={contentRef}
      className={`song-content-scrollable flex-1 min-h-0 ${isAuthenticated || autoScrollIsActive ? 'overflow-y-auto' : 'overflow-hidden'} overflow-x-hidden relative`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        width: '100%',
        maxWidth: '100%'
      }}
      onTouchStart={handleTouchStart}
    >
      <div className="px-3 sm:px-4 md:px-6 py-4 bg-gray-50">
        <div className="max-w-4xl mx-auto w-full space-y-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 dark:bg-gray-900/60 sm:gap-3">
            <div className="flex items-start gap-2 sm:items-center">
            <div className="min-w-0 flex-1">
              <h2
                className="truncate text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-base"
                dir={/[\u0590-\u05FF]/.test(transposedSong?.title || '') ? 'rtl' : 'ltr'}
              >
                {transposedSong?.title || ''}
              </h2>
              {transposedSong?.author && (
                <Link
                  href={`/songs?searchQuery=${encodeURIComponent(transposedSong.author)}&page=1`}
                  className="mt-0.5 block max-w-full truncate text-left text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-xs"
                  dir={/[\u0590-\u05FF]/.test(transposedSong.author) ? 'rtl' : 'ltr'}
                >
                  {transposedSong.author}
                </Link>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {onToggleEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onToggleEdit}
                    className="h-11 min-h-[44px] shrink-0 gap-1.5 rounded-xl px-3 text-sm font-medium"
                    aria-label={t('songHeader.edit')}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">{t('songHeader.edit')}</span>
                  </Button>
                )}
                {isInLibrary && (
                  <div
                    className="inline-flex h-11 min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-green-600/25 bg-green-500/10 px-2.5 text-green-700 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-400"
                    title={t('library.inYourLibrary')}
                  >
                    <CheckIcon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="hidden text-xs font-medium sm:inline">
                      {t('library.inYourLibrary')}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isInLibrary) {
                      onAddToLibrary?.();
                      return;
                    }
                    onToggleFavorite?.();
                  }}
                  disabled={
                    isTogglingFavorite ||
                    (!isInLibrary && !onAddToLibrary) ||
                    (isInLibrary && !onToggleFavorite)
                  }
                  className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border/80 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-70"
                  aria-label={
                    isInLibrary
                      ? isLiked
                        ? t('library.removeFromFavorites')
                        : t('library.addToFavorites')
                      : t('library.addToLibrary')
                  }
                  title={
                    isInLibrary
                      ? isLiked
                        ? t('library.removeFromFavorites')
                        : t('library.addToFavorites')
                      : t('library.addToLibrary')
                  }
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-6 w-6" />
                  ) : (
                    <HeartIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
              {isAuthenticated && onFolderChange && (
                <div className="hidden w-full justify-end sm:flex">
                  <FolderDropdown
                    currentFolderId={currentFolderId}
                    folders={folders}
                    onFolderChange={onFolderChange}
                    size="comfortable"
                  />
                </div>
              )}
            </div>
            </div>
            {isAuthenticated && onFolderChange && (
              <div className="w-full sm:hidden">
                <FolderDropdown
                  currentFolderId={currentFolderId}
                  folders={folders}
                  onFolderChange={onFolderChange}
                  size="comfortable"
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Chord Diagrams Section - accordion */}
          <Collapsible
            open={chordSectionOpen}
            onOpenChange={setChordSectionOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className="w-full font-semibold text-gray-900 dark:text-gray-100 py-3 px-4 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer select-none touch-manipulation flex items-center min-h-[48px]"
              >
                <MusicalNoteIcon className="w-5 h-5 mr-2 shrink-0" />
                Accords utilisés
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-2.5">
                <ChordDiagramsGrid
                  song={transposedSong}
                  onChordClick={onChordClick}
                  fontSize={fontSize}
                  selectedInstrument={selectedInstrument}
                  knownChordIds={knownChordIds}
                  chordNameToIdMap={chordNameToIdMap}
                  chords={chords}
                />

                <div className="flex items-center gap-1.5 max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:pb-0.5 sm:flex-wrap sm:gap-2">
                {/* Fixed height so expand/collapse does not shift sibling controls */}
                <div className="flex h-12 shrink-0 items-center sm:h-11">
                <div
                  onClick={() => {
                    if (!showTransposeControls) setShowTransposeControls(true);
                  }}
                  className={cn(
                    'flex h-full items-center overflow-hidden border border-border/80 bg-muted/40 text-foreground',
                    'transition-[width,border-radius,padding] duration-300 ease-out',
                    showTransposeControls
                      ? 'rounded-xl px-2 sm:px-2'
                      : 'cursor-pointer rounded-full px-4 hover:bg-muted/70 sm:px-4'
                  )}
                >
                  {!showTransposeControls ? (
                    <div className="text-sm font-medium whitespace-nowrap sm:text-sm">Transpose</div>
                  ) : (
                    <div
                      className="flex h-full flex-nowrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                    <Select value={currentKey} onValueChange={handleKeySelect}>
                      <SelectTrigger className="h-10 w-[3.75rem] shrink-0 gap-0.5 rounded-xl border border-amber-200/80 bg-background/50 px-2 text-sm font-medium shadow-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-700/50 [&>svg]:h-4 [&>svg]:w-4 sm:h-11 sm:w-[4.5rem] sm:gap-1 sm:px-2 sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-border/80 bg-muted/40 sm:rounded-xl">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center text-base text-foreground transition-colors hover:bg-muted disabled:opacity-40 sm:h-10 sm:w-9 sm:text-sm"
                        onClick={() => onSetTransposeValue?.(Math.max(-11, transposeValue - 1))}
                        disabled={transposeValue <= -11}
                        aria-label="-"
                      >
                        −
                      </button>
                      <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400 sm:min-w-[2.4rem] sm:text-sm">
                        {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                      </span>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center text-base text-foreground transition-colors hover:bg-muted disabled:opacity-40 sm:h-10 sm:w-9 sm:text-sm"
                        onClick={() => onSetTransposeValue?.(Math.min(11, transposeValue + 1))}
                        disabled={transposeValue >= 11}
                        aria-label="+"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTransposeControls(false);
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 sm:h-11 sm:w-11"
                      aria-label={t('common.close')}
                    >
                      <XMarkIcon className="h-5 w-5 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                )}
                </div>
                </div>

                {!hasOnlyEasyChords && onToggleEasyChordMode && (
                  <button
                    type="button"
                    onClick={onToggleEasyChordMode}
                    className={toolPillClass(easyChordMode)}
                  >
                    {t('songHeader.easyChords')}
                  </button>
                )}

                {onSetSelectedInstrument && (
                  <div className={cn(segmentClass, 'shrink-0')}>
                    <button
                      type="button"
                      onClick={() => onSetSelectedInstrument('piano')}
                      className={segmentOptionClass(selectedInstrument === 'piano')}
                      aria-label={t('songHeader.piano')}
                      title={t('songHeader.piano')}
                    >
                      <Piano className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetSelectedInstrument('guitar')}
                      className={segmentOptionClass(selectedInstrument === 'guitar')}
                      aria-label={t('songHeader.guitar')}
                      title={t('songHeader.guitar')}
                    >
                      <Guitar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                )}
                </div>

                {bpm && (
                  <p className="text-sm font-medium text-blue-600">{bpm} BPM</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Song Content */}
          <StructuredSongContent 
            song={transposedSong} 
            onChordClick={onChordClick}
            fontSize={fontSize}
          />

          {isAuthenticated && (
            <SongEndSuggestions
              currentSongId={transposedSong.id}
              currentAuthor={transposedSong.author ?? ''}
              currentGenre={transposedSong.genre}
              librarySongs={librarySongs}
              nextSong={nextSong}
              onPlayNext={onPlayNext}
            />
          )}
        </div>
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
  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const indices = new Set<number>();
    song.sections.forEach((s: { name: string }, i: number) => {
      if (s.name !== 'Version Description') indices.add(i);
    });
    return indices;
  });

  const toggleSection = (sectionIndex: number, open: boolean) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (open) next.add(sectionIndex);
      else next.delete(sectionIndex);
      return next;
    });
  };

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
  const [windowWidth, setWindowWidth] = useState<number>(1024); // Default to desktop width
  
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      setWindowWidth(width);
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
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  // Get optimal font size based on screen size
  const getOptimalFontSize = (baseFontSize: number): number => {
    // Use windowWidth state to avoid accessing window during SSR
    return getResponsiveFontSize(baseFontSize, windowWidth);
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
    <div className="leading-relaxed space-y-1 w-full overflow-x-hidden" style={{ 
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
        if (section.name === 'Version Description') return null;
        const isOpen = openSections.has(sectionIndex);
        return (
          <Collapsible
            key={sectionIndex}
            open={isOpen}
            onOpenChange={(open) => toggleSection(sectionIndex, open)}
            className="w-full"
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            <CollapsibleTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                dir="ltr"
                className="w-full cursor-pointer select-none touch-manipulation rounded-md bg-gray-100 px-3 py-2.5 text-right font-medium text-gray-700 hover:bg-gray-200/90 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                style={{
                  fontSize: `${Math.min(optimalFontSize + 2, 16)}px`,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                }}
              >
                {formatSectionDisplayName(section.name)}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 w-full pt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {section.lines.map((line: any, lineIndex: number) =>
                  renderSongLine(line, lineIndex)
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

// Helper function to group chords by position and calculate horizontal offsets
interface ChordWithOffset {
  chord: string;
  position: number;
  horizontalOffset: number;
  originalIndex: number;
}

function groupChordsByPosition(
  chords: Array<{ chord: string; position: number }>,
  fontSize: number,
  charWidth: number,
  spacing: number = 50
): ChordWithOffset[] {
  // Create a map to group chords by position
  const positionGroups = new Map<number, Array<{ chord: string; originalIndex: number }>>();
  
  chords.forEach((chordPos, index) => {
    if (!positionGroups.has(chordPos.position)) {
      positionGroups.set(chordPos.position, []);
    }
    positionGroups.get(chordPos.position)!.push({
      chord: chordPos.chord,
      originalIndex: index
    });
  });
  
  // Calculate text width for a chord using canvas for precise measurement (client-only; SSR uses fallback)
  const getChordWidth = (chord: string): number => {
    if (typeof document === 'undefined') {
      return chord.length * charWidth * 1.1;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      // Fallback: estimate width based on character count with better approximation
      return chord.length * charWidth * 1.1; // Slight padding for safety
    }
    context.font = `${fontSize}px Monaco, "Lucida Console", "Courier New", monospace`;
    const measuredWidth = context.measureText(chord).width;
    // Add a small padding to ensure no overlap
    return measuredWidth + 2;
  };
  
  // Process each position group and calculate offsets
  const result: ChordWithOffset[] = [];
  
  positionGroups.forEach((chordGroup, position) => {
    // If only one chord at this position, no offset needed
    if (chordGroup.length === 1) {
      result.push({
        chord: chordGroup[0].chord,
        position,
        horizontalOffset: 0,
        originalIndex: chordGroup[0].originalIndex
      });
      return;
    }
    
    // Multiple chords at same position - place them sequentially
    let cumulativeOffset = 0;
    
    chordGroup.forEach(({ chord, originalIndex }, index) => {
      result.push({
        chord,
        position,
        horizontalOffset: cumulativeOffset,
        originalIndex
      });
      
      // Calculate the width of this chord
      const chordWidth = getChordWidth(chord);
      
      // Add this chord's width plus spacing for the next chord
      // Use dynamic spacing based on font size for better visual separation
      const dynamicSpacing = Math.max(spacing, fontSize * 0.3);
      cumulativeOffset += chordWidth + dynamicSpacing;
    });
  });
  
  // Sort by original index to maintain order
  result.sort((a, b) => a.originalIndex - b.originalIndex);
  
  return result;
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
          {(() => {
            // Group chords by position and calculate horizontal offsets
            const groupedChords = groupChordsByPosition(line.chords, fontSize, charWidth);
            
            return groupedChords.map((chordWithOffset, chordIndex) => {
              // Ensure chord doesn't go beyond lyrics length
              const safePosition = Math.min(chordWithOffset.position, line.lyrics.length);
              const baseLeftOffset = Math.min(safePosition * charWidth, containerWidth - 50); // Prevent overflow
              // Add horizontal offset for chords at the same position
              const leftOffset = baseLeftOffset + chordWithOffset.horizontalOffset;
              
              return (
                <button
                  key={chordIndex}
                  onClick={() => onChordClick(chordWithOffset.chord)}
                  className="absolute hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap z-10"
                  style={{ 
                    left: isHebrew ? 'auto' : `${leftOffset}px`,
                    right: isHebrew ? `${leftOffset}px` : 'auto',
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.4,
                    maxWidth: 'calc(100vw - 40px)'
                  }}
                >
                  {chordWithOffset.chord}
                </button>
              );
            });
          })()}
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
              {(() => {
                // Group chords by position and calculate horizontal offsets
                const charWidth = fontSize * 0.58;
                const groupedChords = groupChordsByPosition(wrappedLine.chords, fontSize, charWidth);
                
                return groupedChords.map((chordWithOffset, chordIndex) => {
                  const baseLeftOffset = Math.max(0, Math.min(chordWithOffset.position * charWidth, measurementOptions.containerWidth - 50));
                  // Add horizontal offset for chords at the same position
                  const leftOffset = baseLeftOffset + chordWithOffset.horizontalOffset;
                  
                  return (
                    <button
                      key={chordIndex}
                      onClick={() => onChordClick(chordWithOffset.chord)}
                      className="absolute hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap z-10"
                      style={{ 
                        left: isHebrew ? 'auto' : `${leftOffset}px`,
                        right: isHebrew ? `${leftOffset}px` : 'auto',
                        fontSize: `${fontSize}px`,
                        lineHeight,
                        maxWidth: 'calc(100vw - 40px)'
                      }}
                    >
                      {chordWithOffset.chord}
                    </button>
                  );
                });
              })()}
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
  selectedInstrument?: ChordInstrument;
  knownChordIds?: Set<string>;
  chordNameToIdMap?: Map<string, string>;
  chords?: Chord[]; // Full chord objects from database
}

// Normalize chord name for comparison
function normalizeChordName(chord: string): string {
  if (!chord) return '';
  let normalized = chord.trim().toUpperCase();
  const enharmonicMap: { [key: string]: string } = {
    'C#': 'DB', 'D#': 'EB', 'F#': 'GB', 'G#': 'AB', 'A#': 'BB'
  };
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat);
      break;
    }
  }
  return normalized;
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

function ChordDiagramsGrid({ 
  song, 
  onChordClick, 
  fontSize,
  selectedInstrument = 'guitar',
  knownChordIds = new Set(),
  chordNameToIdMap = new Map(),
  chords = []
}: ChordDiagramsGridProps) {
  const { extractAllChords } = require('@/utils/structuredSong');
  const allChords = extractAllChords(song);
  const chordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chordBoxesRef = useRef<Map<string, ChordBox>>(new Map());
  
  // Filter out known chords - only show chords the user doesn't know yet
  const unknownChords = useMemo(() => {
    return allChords.filter((songChordName: string) => {
      const normalized = normalizeChordName(songChordName);
      const chordId = chordNameToIdMap.get(normalized);
      const isKnown = chordId ? knownChordIds.has(chordId) : false;
      return !isKnown; // Only keep chords that are NOT known
    });
  }, [allChords, chordNameToIdMap, knownChordIds]);

  const dbOnlyChords = useMemo(
    () =>
      unknownChords.filter(
        (songChordName: string) => getChordVariantGroup(songChordName) == null
      ),
    [unknownChords]
  );

  const useGuitarDiagrams = selectedInstrument !== 'piano';
  
  // DB fallback diagrams (variant groups use VexChordDiagram in JSX)
  useEffect(() => {
    if (!useGuitarDiagrams) return;
    if (chords.length === 0 || dbOnlyChords.length === 0) return;
    
    const timer = setTimeout(() => {
      dbOnlyChords.forEach((songChordName: string) => {
        const dbChord = findChordInDatabase(songChordName, chords);
        if (!dbChord) return;
        
        const container = chordRefs.current.get(songChordName);
        if (!container) return;
        
        container.innerHTML = '';
        chordBoxesRef.current.delete(songChordName);
        
        const chordBox = new ChordBox(container, CHORD_PREVIEW_DIAGRAM_OPTS);
        
        chordBoxesRef.current.set(songChordName, chordBox);
        chordBox.draw({
          chord: dbChord.chordData.chord,
          position: dbChord.chordData.position,
          barres: dbChord.chordData.barres,
          tuning: dbChord.tuning,
        });
      });
    }, 0);
    
    return () => {
      clearTimeout(timer);
    };
  }, [dbOnlyChords, chords, useGuitarDiagrams]);
  
  return (
    <div>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 md:overflow-visible md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3">
        {unknownChords.map((songChordName: string) => {
          const variantGroup = getChordVariantGroup(songChordName);
          const previewVariant = variantGroup?.variants[0];
          const dbChord =
            variantGroup == null ? findChordInDatabase(songChordName, chords) : null;
          const hasPianoDiagram =
            selectedInstrument === 'piano' && hasPianoChordDiagram(songChordName);
          const hasDiagram =
            hasPianoDiagram ||
            (selectedInstrument !== 'piano' &&
              (previewVariant != null || dbChord != null));

          if (!hasDiagram) {
            return (
              <button
                key={songChordName}
                type="button"
                onClick={() => onChordClick(songChordName)}
                className={cn(
                  'flex min-h-[9.75rem] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-2 shadow-sm hover:border-blue-400 hover:shadow-md sm:w-full',
                  CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS
                )}
              >
                <span
                  className="text-center font-bold text-gray-900"
                  style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
                  title={songChordName}
                >
                  {songChordName}
                </span>
              </button>
            );
          }

          const useGuitarDiagrams = selectedInstrument !== 'piano';
          const previewDiagram =
            useGuitarDiagrams && previewVariant
              ? {
                  ...previewVariant.chord,
                  name: variantGroup!.symbol,
                }
              : null;

          return (
            <ChordPreviewCard
              key={songChordName}
              chordLabel={songChordName}
              instrument={selectedInstrument}
              diagram={previewDiagram}
              diagramContainerRef={
                useGuitarDiagrams && !previewDiagram
                  ? (el) => {
                      if (el) chordRefs.current.set(songChordName, el);
                    }
                  : undefined
              }
              onClick={() => onChordClick(songChordName)}
              className={cn(
                'sm:w-full',
                selectedInstrument === 'piano'
                  ? CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS
                  : CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
