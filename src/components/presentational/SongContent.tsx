'use client';

import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  CheckIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  HeartIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';
import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ChordOverLyricsLine from '@/components/presentational/ChordOverLyricsLine';
import SongStructuredEditor from '@/components/presentational/SongStructuredEditor';
import { getOptimalLineHeight, getResponsiveFontSize } from '@/utils/textMeasurement';
import { getSongChordFontFamily, getSongLyricsFontFamily } from '@/utils/songFonts';
import type { ChordInstrument } from '@/components/chords/InstrumentToggle';
import type { Chord, Folder, SongLine, SongSection } from '@/types';
import FolderDropdown from '@/components/FolderDropdown';
import { normalizeChordNameForComparison } from '@/utils/chords';
import { generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import { formatSectionDisplayName } from '@/utils/sectionDisplayName';
import { groupLinesForDisplay } from '@/utils/repeatBlockGroups';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Piano, Guitar, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import ShareWithFriendIconButton from '@/components/social/ShareWithFriendIconButton';
import { containsHebrew, getTextDirection } from '@/utils/rtl';

const ChordDiagramsGrid = dynamic(
  () => import('./ChordDiagramsGrid').then((mod) => mod.ChordDiagramsGrid),
  { ssr: false }
);
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SongEndSuggestions, type NextSongRef } from './SongEndSuggestions';
import { SongStoryCard } from './SongStoryCard';
import { StarRatingDisplay } from './StarRatingDisplay';
import { useSongCover } from '@/lib/hooks/useSongCover';
import { SongCoverPlaceholder } from '@/components/presentational/SongCoverPlaceholder';
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
  editSections: SongSection[];
  transposedSong: any;
  transposedContent: string;
  fontSize: number;
  contentRef: RefObject<HTMLDivElement>;
  isSaving: boolean;
  onUpdateLine: (sectionIndex: number, lineIndex: number, line: SongLine) => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onAddLine: (sectionIndex: number, lineType: SongLine['type']) => void;
  onDeleteLine: (sectionIndex: number, lineIndex: number) => void;
  onMoveLine: (sectionIndex: number, lineIndex: number, direction: 'up' | 'down') => void;
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
  librarySongId?: string;
  isLiked?: boolean;
  onAddToLibrary?: () => void;
  isAddingToLibrary?: boolean;
  onRemoveFromLibrary?: () => void;
  isRemovingFromLibrary?: boolean;
  libraryActionFeedback?: { type: 'success' | 'error'; message: string } | null;
  onToggleFavorite?: () => void;
  isTogglingFavorite?: boolean;
  selectedInstrument?: 'piano' | 'guitar';
  onSetSelectedInstrument?: (instrument: 'piano' | 'guitar') => void;
  transposeValue?: number;
  onSetTransposeValue?: (value: number) => void;
  easyChordMode?: boolean;
  onToggleEasyChordMode?: () => void;
  nextSong?: NextSongRef | null;
  onPlayNext?: () => void;
  onReachSongEnd?: () => void;
  canAwardOnEndReach?: boolean;
  folders?: Folder[];
  currentFolderId?: string;
  onFolderChange?: (folderId: string | undefined) => Promise<void>;
  youtubeTutorialOpen?: boolean;
  youtubeVideoMode?: 'tutorial' | 'original';
  onSelectYoutubeMode?: (mode: 'tutorial' | 'original') => void;
}

export default function SongContent({
  isEditing,
  editSections,
  transposedSong,
  transposedContent,
  fontSize,
  contentRef,
  isSaving,
  onUpdateLine,
  onAddSection,
  onDeleteSection,
  onAddLine,
  onDeleteLine,
  onMoveLine,
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
  librarySongId,
  isLiked = false,
  onAddToLibrary,
  isAddingToLibrary = false,
  onRemoveFromLibrary,
  isRemovingFromLibrary = false,
  libraryActionFeedback = null,
  onToggleFavorite,
  isTogglingFavorite = false,
  selectedInstrument = 'piano',
  onSetSelectedInstrument,
  transposeValue = 0,
  onSetTransposeValue,
  easyChordMode = false,
  onToggleEasyChordMode,
  nextSong = null,
  onPlayNext,
  onReachSongEnd,
  canAwardOnEndReach = false,
  folders = [],
  currentFolderId,
  onFolderChange,
  youtubeTutorialOpen = false,
  youtubeVideoMode = 'tutorial',
  onSelectYoutubeMode,
}: SongContentProps) {
  const { t, isRtl } = useLanguage();
  const pathname = usePathname();
  const { user, signInWithGoogle } = useAuthContext();
  const pinchRef = useRef<{ initialDistance: number; initialFontSize: number } | null>(null);
  const endSuggestionsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!canAwardOnEndReach || !onReachSongEnd || !isAuthenticated) return;

    const el = endSuggestionsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onReachSongEnd();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [canAwardOnEndReach, onReachSongEnd, isAuthenticated, transposedSong.id]);

  const [chordSectionOpen, setChordSectionOpen] = useState(true);
  const [showTransposeControls, setShowTransposeControls] = useState(false);

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

  const coverUrl = useSongCover(transposedSong);

  const songTitleBlock = (
    <div className="min-w-0 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="truncate text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-base">
        {transposedSong?.title || ''}
      </h2>
      {transposedSong?.author && (
        <Link
          href={`/songs?searchQuery=${encodeURIComponent(transposedSong.author)}&page=1`}
          className="mt-0.5 block max-w-full truncate text-start text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-xs"
        >
          {transposedSong.author}
        </Link>
      )}
    </div>
  );

  const titleRowHeight = 'h-14 min-h-14 sm:h-16 sm:min-h-16';

  const songCoverVignette = (
    <div
      className={cn(
        'relative w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-16',
        titleRowHeight
      )}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <SongCoverPlaceholder iconClassName="min-h-7 min-w-7 max-h-10 max-w-10" />
      )}
    </div>
  );

  const folderViewHref = currentFolderId
    ? `/songs?folder=${currentFolderId}`
    : '/songs?folder=unorganized'

  const folderControl =
    isInLibrary && isAuthenticated && onFolderChange ? (
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <FolderDropdown
            currentFolderId={currentFolderId}
            folders={folders}
            onFolderChange={onFolderChange}
            size="comfortable"
            fullWidth
          />
        </div>
        <Button
          asChild
          variant="outline"
          className="h-11 shrink-0 whitespace-nowrap rounded-lg px-2.5 text-xs sm:px-3 sm:text-sm"
        >
          <Link href={folderViewHref}>{t('songContent.seeThisFolder')}</Link>
        </Button>
      </div>
    ) : null;

  const titleRowStatHeight = titleRowHeight;

  const ratingDisplay =
    transposedSong?.rating != null ? (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/30 px-3',
          titleRowStatHeight
        )}
      >
        <StarRatingDisplay rating={Number(transposedSong.rating)} size="md" />
      </div>
    ) : null;

  const viewsDisplay =
    transposedSong?.viewCount != null && transposedSong.viewCount > 0 ? (
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border/80 bg-white px-2 shadow-sm dark:bg-gray-900 sm:w-16',
          titleRowStatHeight
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/eyeview_icon.jpeg"
          alt=""
          className="h-8 w-8 object-contain"
          aria-hidden
        />
        <span className="text-[10px] font-semibold tabular-nums leading-none text-foreground">
          {transposedSong.viewCount}
        </span>
      </div>
    ) : null;

  const metaRowActionSize = 'h-11 min-h-11 w-11';

  const libraryToggleButton =
    isAuthenticated && (onAddToLibrary || onRemoveFromLibrary) ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isInLibrary) {
            onRemoveFromLibrary?.();
            return;
          }
          onAddToLibrary?.();
        }}
        disabled={
          isAddingToLibrary ||
          isRemovingFromLibrary ||
          (isInLibrary ? !onRemoveFromLibrary : !onAddToLibrary)
        }
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-70',
          metaRowActionSize,
          isInLibrary
            ? 'border-green-600/25 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25'
            : 'border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
        aria-label={
          isInLibrary ? t('library.removeFromLibrary') : t('library.addToLibrary')
        }
        title={isInLibrary ? t('library.removeFromLibrary') : t('library.addToLibrary')}
      >
        {isAddingToLibrary || isRemovingFromLibrary ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isInLibrary ? (
          <CheckIcon className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
    ) : null;

  const favoriteButton = isInLibrary ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite?.();
      }}
      disabled={isTogglingFavorite || !onToggleFavorite}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border border-border/80 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-70',
        titleRowHeight,
        'w-14 sm:w-16'
      )}
      aria-label={
        isLiked ? t('library.removeFromFavorites') : t('library.addToFavorites')
      }
      title={isLiked ? t('library.removeFromFavorites') : t('library.addToFavorites')}
    >
      {isTogglingFavorite ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isLiked ? (
        <HeartSolidIcon className="h-5 w-5" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
    </button>
  ) : null;

  const editButton =
    isInLibrary && onToggleEdit ? (
      <Button
        type="button"
        variant="outline"
        onClick={onToggleEdit}
        className={cn(
          'shrink-0 gap-1 rounded-lg px-2.5 text-xs font-medium sm:px-3',
          titleRowHeight
        )}
        aria-label={t('songHeader.edit')}
      >
        <PencilSquareIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{t('songHeader.edit')}</span>
      </Button>
    ) : isInLibrary && librarySongId ? (
      <Button
        asChild
        variant="outline"
        className={cn(
          'shrink-0 gap-1 rounded-lg px-2.5 text-xs font-medium sm:px-3',
          titleRowHeight
        )}
      >
        <Link href={`/song/${librarySongId}`} aria-label={t('library.editYourCopy')}>
          <PencilSquareIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('library.editYourCopy')}</span>
        </Link>
      </Button>
    ) : null;

  const addToLibraryTitleButton =
    !isInLibrary && isAuthenticated && onAddToLibrary ? (
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onAddToLibrary();
        }}
        disabled={isAddingToLibrary}
        className={cn(
          'shrink-0 rounded-lg px-2.5 sm:px-3',
          titleRowHeight,
          'w-11 sm:w-12'
        )}
        aria-label={t('library.addToLibrary')}
        title={t('library.addToLibrary')}
      >
        {isAddingToLibrary ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </Button>
    ) : null;

  const titleRowTrailingActions =
    ratingDisplay || viewsDisplay || favoriteButton || editButton || addToLibraryTitleButton ? (
      <div className="flex shrink-0 items-stretch gap-1.5 self-stretch sm:gap-2">
        {ratingDisplay}
        {viewsDisplay}
        {favoriteButton}
        {editButton}
        {addToLibraryTitleButton}
      </div>
    ) : null;

  const songMetaRow =
    folderControl || (isInLibrary ? libraryToggleButton : null) || libraryActionFeedback ? (
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex w-full items-center gap-1.5">
          {folderControl}
          {libraryToggleButton}
        </div>
        {libraryActionFeedback ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'text-xs font-medium',
              libraryActionFeedback.type === 'success'
                ? 'text-green-700 dark:text-green-400'
                : 'text-destructive'
            )}
          >
            {libraryActionFeedback.message}
          </p>
        ) : null}
      </div>
    ) : null;

  if (isEditing) {
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <SongStructuredEditor
          sections={editSections}
          fontSize={fontSize}
          isSaving={isSaving}
          onUpdateLine={onUpdateLine}
          onAddSection={onAddSection}
          onDeleteSection={onDeleteSection}
          onAddLine={onAddLine}
          onDeleteLine={onDeleteLine}
          onMoveLine={onMoveLine}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

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
            <div className="flex flex-col gap-3">
              <div className={cn('flex items-center gap-2', titleRowHeight)}>
                {songCoverVignette}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                    {songTitleBlock}
                  </div>
                  {titleRowTrailingActions}
                </div>
              </div>
              {songMetaRow}
              {(onSelectYoutubeMode || user) && (
                <div className="flex items-center gap-2">
                  {onSelectYoutubeMode && (
                    <div
                      className={cn(
                        'flex h-11 min-w-0 flex-1 items-stretch gap-0.5 rounded-xl border p-0.5',
                        youtubeTutorialOpen
                          ? 'border-red-500/40 bg-red-500/10'
                          : 'border-border/80 bg-muted/30'
                      )}
                      role="group"
                      aria-label={t('youtubeTutorial.title')}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectYoutubeMode('tutorial')}
                        className={cn(
                          'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[0.65rem] px-2 text-sm font-medium transition-colors',
                          youtubeTutorialOpen && youtubeVideoMode === 'tutorial'
                            ? 'bg-background text-red-600 shadow-sm dark:text-red-400'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        aria-pressed={youtubeTutorialOpen && youtubeVideoMode === 'tutorial'}
                      >
                        <Youtube className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t('youtubeTutorial.modeTutorial')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectYoutubeMode('original')}
                        className={cn(
                          'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[0.65rem] px-2 text-sm font-medium transition-colors',
                          youtubeTutorialOpen && youtubeVideoMode === 'original'
                            ? 'bg-background text-red-600 shadow-sm dark:text-red-400'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        aria-pressed={youtubeTutorialOpen && youtubeVideoMode === 'original'}
                      >
                        <Youtube className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t('youtubeTutorial.modeOriginal')}</span>
                      </button>
                    </div>
                  )}
                  {user && (
                    <ShareWithFriendIconButton
                      entityType="song"
                      entityId={transposedSong.id}
                      entityTitle={transposedSong.title}
                      className="h-11 w-11 rounded-xl border border-border/80 bg-muted/30 text-foreground hover:bg-muted/60 hover:text-foreground"
                    />
                  )}
                </div>
              )}
            </div>
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
                className="w-full font-semibold text-gray-900 dark:text-gray-100 py-3 px-4 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer select-none touch-manipulation flex items-center min-h-[48px] text-start"
              >
                <MusicalNoteIcon className="w-5 h-5 me-2 shrink-0" />
                {t('songContent.CHORDS_USED_TITLE')}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-2.5">
                {chordSectionOpen && (
                <ChordDiagramsGrid
                  song={transposedSong}
                  onChordClick={onChordClick}
                  fontSize={fontSize}
                  selectedInstrument={selectedInstrument}
                  knownChordIds={knownChordIds}
                  chordNameToIdMap={chordNameToIdMap}
                  chords={chords}
                />
                )}

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
                    <div className="text-sm font-medium whitespace-nowrap sm:text-sm">{t('songContent.TRANSPOSE_LABEL')}</div>
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
                  <p className="text-sm font-medium text-blue-600">
                    {t('songContent.BPM_LABEL').replace('{bpm}', String(bpm))}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <SongStoryCard
            songId={transposedSong.id}
            title={transposedSong.title}
            author={transposedSong.author ?? ''}
            tabId={transposedSong.tabId}
            genre={transposedSong.genre}
            songKey={transposedSong.key}
            chordProgression={transposedSong.chordProgression}
          />

          {/* Song Content */}
          <StructuredSongContent 
            song={transposedSong} 
            onChordClick={onChordClick}
            fontSize={fontSize}
          />

          {isAuthenticated && (
            <div ref={endSuggestionsRef}>
              <SongEndSuggestions
                currentSongId={transposedSong.id}
                currentAuthor={transposedSong.author ?? ''}
                currentGenre={transposedSong.genre}
                nextSong={nextSong}
                onPlayNext={onPlayNext}
              />
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 z-20 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent backdrop-blur-[1px]">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl border border-gray-200 max-w-sm mx-4 text-center transform translate-y-2">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('songContent.FULL_SONG_HIDDEN_TITLE')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('songContent.FULL_SONG_HIDDEN_DESCRIPTION')}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => signInWithGoogle(pathname)}
                className="w-full h-9 text-sm font-medium sm:h-10"
              >
                {t('auth.signInWithGoogle')}
              </Button>
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
  const { t } = useLanguage();
  const measurementRef = useRef<HTMLDivElement>(null);
  const songTextDirection = useMemo(
    () =>
      getTextDirection(
        song.sections
          .flatMap((section: { lines?: Array<{ lyrics?: string }> }) => section.lines ?? [])
          .map((line: { lyrics?: string }) => line.lyrics ?? '')
          .join('\n') || song.title || ''
      ),
    [song]
  );
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

  // Calculate character width based on font size for precise alignment
  const getCharWidth = (fontSize: number) => {
    return fontSize * 0.58;
  };

  // Get actual text width using canvas for precise measurements
  const getTextWidth = (text: string, fontSize: number): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * getCharWidth(fontSize);
    
    context.font = `${fontSize}px ${getSongLyricsFontFamily(songTextDirection === 'rtl')}`;
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
    const isHebrewLine = containsHebrew(line.lyrics ?? line.chord_line ?? '');
    const lyricsFontFamily = getSongLyricsFontFamily(isHebrewLine);
    const chordFontFamily = getSongChordFontFamily();
    
    if (line.type === 'lyrics_only') {
      return (
        <div key={lineIndex} className="text-gray-900 min-h-[1.8rem] break-words w-full" dir={getTextDirection(line.lyrics)} style={{ 
          fontSize: `${optimalFontSize}px`, 
          lineHeight: optimalLineHeight,
          fontFamily: lyricsFontFamily,
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
        <div key={lineIndex} dir={songTextDirection} className="text-blue-600 font-semibold min-h-[1.8rem] break-words w-full" style={{ 
          fontSize: `${optimalFontSize}px`, 
          lineHeight: optimalLineHeight,
          fontFamily: chordFontFamily,
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
      return (
        <ChordOverLyricsLine 
          key={lineIndex}
          line={line}
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

  const renderSectionLines = (lines: any[]) => {
    return groupLinesForDisplay(lines).map((group, groupIndex) => {
      if (group.kind === 'repeat') {
        return (
          <div
            key={`repeat-${groupIndex}`}
            dir="ltr"
            className={cn(
              'my-2 flex gap-0 overflow-hidden rounded-xl',
              'border border-amber-200/80 dark:border-amber-800/40',
              'bg-amber-50/50 dark:bg-amber-950/20'
            )}
          >
            <div
              className={cn(
                'flex shrink-0 flex-col items-center border-e border-amber-300/70 px-2 py-2',
                'bg-amber-100/70 dark:border-amber-700/50 dark:bg-amber-900/30',
                'text-amber-700 dark:text-amber-400'
              )}
              aria-hidden
            >
              <span className="text-[11px] font-bold tabular-nums leading-none">
                {group.repeatCount}×
              </span>
              <span className="mt-1 text-lg font-light leading-none text-amber-500/90">[</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1 py-1 pe-1">
              {group.lines.map((line, lineIndex) =>
                renderSongLine(line, group.startIndex + lineIndex + 1)
              )}
            </div>
          </div>
        );
      }

      return group.lines.map((line, lineIndex) =>
        renderSongLine(line, group.startIndex + lineIndex)
      );
    });
  };
  
  const optimalFontSize = getOptimalFontSize(fontSize);
  const optimalLineHeight = getOptimalLineHeight(optimalFontSize);
  const songHasHebrew = songTextDirection === 'rtl';

  return (
    <div className="leading-relaxed space-y-1 w-full overflow-x-hidden" style={{ 
      fontSize: `${optimalFontSize}px`,
      lineHeight: optimalLineHeight,
      fontFamily: getSongLyricsFontFamily(songHasHebrew),
      maxWidth: '100%',
      width: '100%'
    }}>
      {/* Hidden measurement element for precise text width calculations */}
      <div 
        ref={measurementRef}
        className="absolute -top-[9999px] left-0 opacity-0 pointer-events-none whitespace-pre"
        style={{ 
          fontSize: `${optimalFontSize}px`,
          fontFamily: getSongLyricsFontFamily(songHasHebrew)
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
                dir={getTextDirection(section.name)}
                className="w-full cursor-pointer select-none touch-manipulation rounded-md bg-gray-100 px-3 py-2.5 text-start font-medium text-gray-700 hover:bg-gray-200/90 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                style={{
                  fontSize: `${Math.min(optimalFontSize + 2, 16)}px`,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                }}
              >
                {formatSectionDisplayName(section.name, t)}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 w-full pt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {renderSectionLines(section.lines)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
