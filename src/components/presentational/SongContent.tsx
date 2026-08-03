'use client';

import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  HeartIcon,
  PlusIcon,
  ShareIcon,
  SpeakerWaveIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ChordOverLyricsLine from '@/components/presentational/ChordOverLyricsLine';
import SongStructuredEditor from '@/components/presentational/SongStructuredEditor';
import { getOptimalLineHeight, getResponsiveFontSize } from '@/utils/textMeasurement';
import { getSongChordFontFamily, getSongLyricsFontFamily } from '@/utils/songFonts';
import type { ChordInstrument } from '@/components/chords/InstrumentToggle';
import type { Chord, Folder, SongLine, SongSection, SongRecording } from '@/types';
import FolderDropdown from '@/components/FolderDropdown';
import { normalizeChordNameForComparison } from '@/utils/chords';
import { generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import { formatSectionDisplayName } from '@/utils/sectionDisplayName';
import { groupLinesForDisplay } from '@/utils/repeatBlockGroups';
import { cn } from '@/lib/utils';
import { absoluteSongShareUrl } from '@/lib/seo/songPath';
import { Button } from '@/components/ui/button';
import { InstrumentToggle } from '@/components/chords/InstrumentToggle';
import { InstrumentSwitchHint } from '@/components/chords/InstrumentSwitchHint';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import ShareWithFriendIconButton from '@/components/social/ShareWithFriendIconButton';
import { containsHebrew, getTextDirection } from '@/utils/rtl';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CHORD_SECTION_AUTO_COLLAPSE_AFTER,
  incrementChordSectionOpenCount,
  markChordCollapseHintSeen,
  readChordSectionOpenCount,
  resolveInitialChordSectionOpen,
  shouldShowChordCollapseHint,
} from '@/utils/chordSectionPrefs';
import { SongEndSuggestions, type NextSongRef } from './SongEndSuggestions';
import { SongRecordingPanel } from '@/components/practice/SongRecordingPanel';
import {
  PracticeComingSoonChip,
} from '@/components/practice/PracticeComingSoonBanner';
import {
  RecordSongChip,
  useRecordSongPromo,
} from '@/components/practice/RecordSongPromoBanner';
import type { YoutubeVideoMode } from '@/utils/youtubeTutorial';
import { SignInPromoBanner } from '@/components/auth/SignInPromoBanner';
import { SONG_RECORDING_ENABLED } from '@/lib/featureFlags';
import { usePracticeAudio } from '@/lib/hooks/usePracticeAudio';
import { SongStoryCard } from './SongStoryCard';
import { StarRatingDisplay } from './StarRatingDisplay';
import { useSongCover } from '@/lib/hooks/useSongCover';
import { useLandscapePractice } from '@/lib/hooks/useLandscapePractice';
import {
  extractPracticeLines,
  LandscapePracticeView,
} from '@/components/practice/LandscapePracticeView';
import { SongCoverPlaceholder } from '@/components/presentational/SongCoverPlaceholder';
import { VignetteGlossHint } from '@/components/library/PlaylistGlassHeader';
import { fetchArtistSongsForNavAction } from '@/app/song/[id]/artistSongsActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Official YouTube play-mark (brand glyph). */
function YoutubeBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const ChordDiagramsGrid = dynamic(
  () => import('./ChordDiagramsGrid').then((mod) => mod.ChordDiagramsGrid),
  { ssr: false }
);

const toolPillClass = (active: boolean) =>
  cn(
    'inline-flex h-12 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-all duration-200 sm:h-11 sm:px-3 sm:text-sm',
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
  youtubeVideoMode?: YoutubeVideoMode;
  onSelectYoutubeMode?: (mode: YoutubeVideoMode) => void;
  onOpenSongQueue?: () => void;
  youtubeLyricSeekEnabled?: boolean;
  youtubeLyricSyncLookup?: Map<string, { startSec: number | null }>;
  youtubeActiveLyricKey?: string | null;
  onYoutubeLyricLineClick?: (sectionIndex: number, lineIndex: number) => void;
  hasLyricPractice?: boolean;
  onStartLyricPracticeTutorial?: () => void;
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
  onOpenSongQueue,
  youtubeLyricSeekEnabled = false,
  youtubeLyricSyncLookup,
  youtubeActiveLyricKey = null,
  onYoutubeLyricLineClick,
  hasLyricPractice = false,
  onStartLyricPracticeTutorial,
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

  const [chordSectionOpen, setChordSectionOpen] = useState(() =>
    typeof window === 'undefined' ? true : resolveInitialChordSectionOpen()
  );
  const [chordCollapseHint, setChordCollapseHint] = useState(false);
  const [sheetSectionOpen, setSheetSectionOpen] = useState(true);

  useEffect(() => {
    const open = resolveInitialChordSectionOpen();
    setChordSectionOpen(open);
    const pastThreshold = readChordSectionOpenCount() >= CHORD_SECTION_AUTO_COLLAPSE_AFTER;
    if (!open && pastThreshold && shouldShowChordCollapseHint()) {
      setChordCollapseHint(true);
      markChordCollapseHintSeen();
      const id = window.setTimeout(() => setChordCollapseHint(false), 2800);
      return () => window.clearTimeout(id);
    }
  }, []);

  const handleChordSectionOpenChange = useCallback((open: boolean) => {
    setChordSectionOpen(open);
    if (open) {
      incrementChordSectionOpenCount();
    }
  }, []);
  const sheetImageUrl =
    typeof transposedSong?.sheetImageUrl === 'string' && transposedSong.sheetImageUrl.trim()
      ? transposedSong.sheetImageUrl.trim()
      : null;
  const [showTransposeControls, setShowTransposeControls] = useState(false);
  const [metaDetailsOpen, setMetaDetailsOpen] = useState(!isAuthenticated);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceLineIndex, setPracticeLineIndex] = useState(0);
  const [practicePlaying, setPracticePlaying] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<SongRecording | null>(null);
  const [recordingPlaybackUrl, setRecordingPlaybackUrl] = useState<string | null>(null);
  const practiceAudio = usePracticeAudio();
  const {
    phase: recordPromoPhase,
    dismiss: dismissRecordPromo,
  } = useRecordSongPromo();
  const [recordIsActive, setRecordIsActive] = useState(false);
  const [recordReady, setRecordReady] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const recordStartRef = useRef<(() => void) | null>(null);

  const handleRecordControlsReady = useCallback(
    (controls: {
      startRecording: () => void;
      stopRecording: () => void;
      isRecording: boolean;
    }) => {
      recordStartRef.current = controls.startRecording;
      setRecordReady(true);
      setRecordIsActive((prev) =>
        prev === controls.isRecording ? prev : controls.isRecording
      );
    },
    []
  );

  const useRecordingPractice =
    practiceMode &&
    Boolean(selectedRecording && selectedRecording.lineMarkers.length > 0 && recordingPlaybackUrl);
  const { isLandscape } = useLandscapePractice();
  const landscapePracticeActive = practiceMode && isLandscape;

  const practiceLines = useMemo(
    () => extractPracticeLines(transposedSong),
    [transposedSong]
  );

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

  const practiceLineCount = useMemo(() => {
    const sections = transposedSong?.sections ?? [];
    let count = 0;
    for (const section of sections) {
      if (section?.name === 'Version Description') continue;
      count += Array.isArray(section?.lines) ? section.lines.length : 0;
    }
    return Math.max(count, 1);
  }, [transposedSong?.sections]);

  useEffect(() => {
    setPracticeLineIndex((i) => Math.min(i, practiceLineCount - 1));
  }, [practiceLineCount]);

  // Wire selected recording into practice audio hook
  useEffect(() => {
    if (!selectedRecording || !recordingPlaybackUrl) {
      practiceAudio.setSrc(null);
      practiceAudio.setMarkers([]);
      return;
    }
    practiceAudio.setSrc(recordingPlaybackUrl);
    practiceAudio.setMarkers(selectedRecording.lineMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- practiceAudio setters are stable enough; avoid re-binding each render
  }, [selectedRecording, recordingPlaybackUrl]);

  // Sync highlighted line from audio markers
  useEffect(() => {
    if (!useRecordingPractice) return;
    setPracticeLineIndex(
      Math.min(practiceAudio.activeLineIndex, practiceLineCount - 1)
    );
  }, [useRecordingPractice, practiceAudio.activeLineIndex, practiceLineCount]);

  // Keep play state mirrored when using recording audio
  useEffect(() => {
    if (!useRecordingPractice) return;
    setPracticePlaying(practiceAudio.isPlaying);
  }, [useRecordingPractice, practiceAudio.isPlaying]);

  // BPM timer fallback when no recording markers are active
  useEffect(() => {
    if (!practiceMode || !practicePlaying || useRecordingPractice) return;
    const effectiveBpm = typeof bpm === 'number' && bpm > 0 ? bpm : 80;
    const msPerLine = Math.round((60_000 / effectiveBpm) * 4);
    const timer = window.setInterval(() => {
      setPracticeLineIndex((i) => {
        if (i >= practiceLineCount - 1) {
          setPracticePlaying(false);
          return i;
        }
        return i + 1;
      });
    }, msPerLine);
    return () => window.clearInterval(timer);
  }, [practiceMode, practicePlaying, bpm, practiceLineCount, useRecordingPractice]);

  const seekPracticeToLine = (lineIndex: number) => {
    const clamped = Math.max(0, Math.min(lineIndex, practiceLineCount - 1));
    setPracticeLineIndex(clamped);
    if (useRecordingPractice && selectedRecording) {
      const marker = selectedRecording.lineMarkers.find((m) => m.lineIndex === clamped);
      if (marker) {
        practiceAudio.seek(marker.startMs);
      }
    }
  };

  const togglePracticePlay = () => {
    if (useRecordingPractice) {
      if (practiceAudio.isPlaying) practiceAudio.pause();
      else practiceAudio.play();
      return;
    }
    setPracticePlaying((p) => !p);
  };

  const exitPracticeMode = () => {
    setPracticeMode(false);
    setPracticePlaying(false);
    practiceAudio.pause();
  };

  const [coverExpanded, setCoverExpanded] = useState(false);
  const [artistSongCount, setArtistSongCount] = useState<number | null>(null);
  const coverVignetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coverExpanded) return;
    const author = transposedSong?.author?.trim();
    if (!author) {
      setArtistSongCount(1);
      return;
    }
    let cancelled = false;
    void fetchArtistSongsForNavAction({
      author,
      excludeSongId: transposedSong?.id,
      limit: 40,
    })
      .then((songs) => {
        if (!cancelled) setArtistSongCount(songs.length + 1);
      })
      .catch(() => {
        if (!cancelled) setArtistSongCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [coverExpanded, transposedSong?.author, transposedSong?.id]);

  useEffect(() => {
    if (!coverExpanded) return;
    const onPointerDown = (event: PointerEvent) => {
      const node = coverVignetteRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setCoverExpanded(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCoverExpanded(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [coverExpanded]);

  const songCountLabel =
    artistSongCount == null
      ? null
      : artistSongCount === 1
        ? t('songHeader.navSongCountOne')
        : t('songHeader.navSongCount').replace('{count}', String(artistSongCount));

  const songTitleBlock = (
    <div className="min-w-0 w-full text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-lg font-bold text-foreground sm:text-base break-words">
        {transposedSong?.title || ''}
      </h2>
      {transposedSong?.author && (
        <Link
          href={`/songs?searchQuery=${encodeURIComponent(transposedSong.author)}&page=1`}
          className="mt-0.5 block w-full text-start text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-xs break-words"
        >
          {transposedSong.author}
        </Link>
      )}
    </div>
  );

  const actionTileHeight = 'h-14 min-h-14 sm:h-16 sm:min-h-16';

  /** Cover tile — expands full width with title/artist inside (no page overlay). */
  const songCoverVignette = (
    <div
      ref={coverVignetteRef}
      className={cn(
        'relative self-start',
        coverExpanded ? 'z-20 w-full min-w-0' : 'z-20 shrink-0'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-muted text-left',
          'border border-black/10 dark:border-white/15',
          'shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/25',
          'transition-[width,height] duration-300 ease-out',
          coverExpanded
            ? 'h-44 w-full rounded-2xl sm:h-48'
            : 'h-14 w-14 sm:h-16 sm:w-16'
        )}
      >
        <button
          type="button"
          onClick={() => setCoverExpanded((v) => !v)}
          aria-expanded={coverExpanded}
          aria-label={transposedSong?.title || t('songHeader.navBrowseSongs')}
          className="absolute inset-0 z-[2]"
        />
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className={cn(
              'pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300',
              coverExpanded ? 'scale-105' : 'scale-100'
            )}
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
            {coverExpanded ? (
              <MusicalNoteIcon className="h-8 w-8 text-primary-foreground/90" />
            ) : (
              <SongCoverPlaceholder iconClassName="min-h-7 min-w-7 max-h-10 max-w-10" />
            )}
          </div>
        )}
        <div
          className={cn(
            'pointer-events-none absolute inset-0',
            coverExpanded
              ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/15'
              : 'bg-gradient-to-t from-black/35 via-transparent to-transparent'
          )}
        />
        <VignetteGlossHint active={coverExpanded} />
        {coverExpanded ? (
          <div className="pointer-events-none relative z-[3] flex h-full flex-col justify-end p-3 sm:p-3.5">
            <p className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow sm:text-lg">
              {transposedSong?.title || ''}
            </p>
            {transposedSong?.author ? (
              <p className="mt-0.5 truncate text-sm text-white/90">{transposedSong.author}</p>
            ) : null}
            {songCountLabel ? (
              <p className="mt-1.5 text-xs text-white/80">{songCountLabel}</p>
            ) : (
              <p className="mt-1.5 text-xs text-white/65">{t('common.loading')}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const folderViewHref = currentFolderId
    ? `/playlists/${currentFolderId}`
    : null

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
        {folderViewHref ? (
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 whitespace-nowrap rounded-lg px-2.5 text-xs sm:px-3 sm:text-sm"
          >
            <Link href={folderViewHref}>{t('songContent.seeThisFolder')}</Link>
          </Button>
        ) : null}
      </div>
    ) : null;

  const ratingDisplay =
    transposedSong?.rating != null ? (
      <div
        className={cn(
          'flex h-11 min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-border/80 bg-muted/30 px-3'
        )}
      >
        <StarRatingDisplay rating={Number(transposedSong.rating)} size="md" />
      </div>
    ) : null;

  const viewsDisplay =
    transposedSong?.viewCount != null && transposedSong.viewCount > 0 ? (
      <div
        className={cn(
          'flex h-11 min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-border/80 bg-card px-2 shadow-sm'
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/eyeview_icon.jpeg"
          alt=""
          className="h-6 w-6 object-contain"
          aria-hidden
        />
        <span className="text-[10px] font-semibold tabular-nums leading-none text-foreground">
          {transposedSong.viewCount}
        </span>
      </div>
    ) : null;

  const capoDisplay =
    transposedSong?.capo !== undefined && transposedSong?.capo !== null ? (
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-border/80 bg-muted/30 px-2 sm:w-16',
          actionTileHeight
        )}
        title={t('songHeader.capo')}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
          {t('songHeader.capo')}
        </span>
        <span className="text-sm font-semibold tabular-nums leading-none text-foreground">
          {transposedSong.capo}
        </span>
      </div>
    ) : null;

  const bpmDisplay =
    typeof bpm === 'number' && bpm > 0 ? (
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-border/80 bg-muted/30 px-2 sm:w-16',
          actionTileHeight
        )}
        title={t('songContent.BPM_LABEL').replace('{bpm}', String(bpm))}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
          BPM
        </span>
        <span className="text-sm font-semibold tabular-nums leading-none text-foreground">
          {bpm}
        </span>
      </div>
    ) : null;

  const metaRowActionSize = 'h-11 min-h-11 w-full';
  const metaRowActionTileClass = cn(
    'inline-flex min-w-0 w-full flex-1 items-center justify-center rounded-xl border transition-colors',
    metaRowActionSize
  );

  const canShowLibraryToggle =
    !isAuthenticated || onAddToLibrary || onRemoveFromLibrary;

  const handleLibraryToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      void signInWithGoogle(pathname);
      return;
    }
    if (isInLibrary) {
      onRemoveFromLibrary?.();
      return;
    }
    onAddToLibrary?.();
  };

  const libraryToggleDisabled =
    isAuthenticated &&
    (isAddingToLibrary ||
      isRemovingFromLibrary ||
      (isInLibrary ? !onRemoveFromLibrary : !onAddToLibrary));

  /** Compact icon button — used inside collapsed meta when already in library. */
  const libraryToggleButton =
    canShowLibraryToggle && isAuthenticated && isInLibrary ? (
      <button
        type="button"
        onClick={handleLibraryToggle}
        disabled={libraryToggleDisabled}
        className={cn(
          metaRowActionTileClass,
          'disabled:opacity-70',
          'border-green-600/25 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25'
        )}
        aria-label={t('library.removeFromLibrary')}
        title={t('library.removeFromLibrary')}
      >
        {isRemovingFromLibrary ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckIcon className="h-5 w-5 shrink-0" aria-hidden />
        )}
      </button>
    ) : null;

  /** Full-width CTA — outside collapsed, just above the expand bar. */
  const addToLibraryFullWidth =
    canShowLibraryToggle && !(isAuthenticated && isInLibrary) ? (
      <button
        type="button"
        onClick={handleLibraryToggle}
        disabled={libraryToggleDisabled}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition-colors',
          'animate-add-library-invite hover:bg-primary/90 disabled:opacity-70'
        )}
        aria-label={t('library.addToLibrary')}
        title={t('library.addToLibrary')}
      >
        {isAuthenticated && isAddingToLibrary ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            <PlusIcon className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span>{t('library.addToLibrary')}</span>
          </>
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
        metaRowActionTileClass,
        'border-border/80 text-red-500 hover:bg-red-500/10 disabled:opacity-70'
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
      <button
        type="button"
        onClick={onToggleEdit}
        className={cn(
          metaRowActionTileClass,
          'border-border/80 text-foreground hover:bg-muted/60'
        )}
        aria-label={t('songHeader.edit')}
        title={t('songHeader.edit')}
      >
        <PencilSquareIcon className="h-5 w-5" />
      </button>
    ) : isInLibrary && librarySongId ? (
      <Link
        href={`/song/${librarySongId}`}
        className={cn(
          metaRowActionTileClass,
          'border-border/80 text-foreground hover:bg-muted/60'
        )}
        aria-label={t('library.editYourCopy')}
        title={t('library.editYourCopy')}
      >
        <PencilSquareIcon className="h-5 w-5" />
      </Link>
    ) : null;

  const youtubeModeButtonClass = (active: boolean) =>
    cn(
      'group/wiggle flex min-h-[3rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-all duration-200 sm:min-h-[3.25rem]',
      active
        ? 'scale-[1.03] bg-gray-200/95 text-foreground shadow-sm dark:bg-white/15'
        : 'bg-transparent text-muted-foreground hover:bg-white/55 dark:hover:bg-white/10'
    );

  const youtubeModeBadgeClass = (active: boolean) =>
    cn(
      'inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px]',
      active
        ? 'bg-white/80 text-foreground dark:bg-white/10'
        : 'bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]'
    );

  const youtubeActions =
    onSelectYoutubeMode ? (
      <div
        className={cn(
          'flex w-full min-w-0 items-stretch gap-1 rounded-2xl border p-1',
          'border-white/70 bg-white/65 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl',
          'dark:border-white/[0.1] dark:bg-white/[0.06]',
          youtubeTutorialOpen && 'ring-1 ring-black/5 dark:ring-white/10'
        )}
        role="group"
        aria-label={t('youtubeTutorial.title')}
      >
        <button
          type="button"
          onClick={() => onSelectYoutubeMode('tutorial')}
          className={youtubeModeButtonClass(
            youtubeTutorialOpen && youtubeVideoMode === 'tutorial'
          )}
          aria-pressed={youtubeTutorialOpen && youtubeVideoMode === 'tutorial'}
        >
          <YoutubeBrandIcon className="icon-hover-wiggle h-5 w-5 shrink-0 text-[#FF0000] sm:h-[1.35rem] sm:w-[1.35rem]" />
          <span
            className={youtubeModeBadgeClass(
              youtubeTutorialOpen && youtubeVideoMode === 'tutorial'
            )}
          >
            {selectedInstrument === 'guitar'
              ? t('youtubeTutorial.guitarModeShort')
              : t('youtubeTutorial.pianoModeShort')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelectYoutubeMode('original')}
          className={youtubeModeButtonClass(
            youtubeTutorialOpen && youtubeVideoMode === 'original'
          )}
          aria-pressed={youtubeTutorialOpen && youtubeVideoMode === 'original'}
        >
          <YoutubeBrandIcon className="icon-hover-wiggle h-5 w-5 shrink-0 text-[#FF0000] sm:h-[1.35rem] sm:w-[1.35rem]" />
          <span
            className={youtubeModeBadgeClass(
              youtubeTutorialOpen && youtubeVideoMode === 'original'
            )}
          >
            {t('youtubeTutorial.modeOriginal')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelectYoutubeMode('audio')}
          className={youtubeModeButtonClass(
            youtubeTutorialOpen && youtubeVideoMode === 'audio'
          )}
          aria-pressed={youtubeTutorialOpen && youtubeVideoMode === 'audio'}
          title={t('youtubeTutorial.modeAudioHint')}
        >
          <SpeakerWaveIcon className="icon-hover-wiggle h-5 w-5 shrink-0 text-[#1DB954] sm:h-[1.35rem] sm:w-[1.35rem]" />
          <span
            className={youtubeModeBadgeClass(
              youtubeTutorialOpen && youtubeVideoMode === 'audio'
            )}
          >
            {t('youtubeTutorial.modeAudio')}
          </span>
        </button>
      </div>
    ) : null;

  const guestShareClassName = cn(
    'inline-flex h-11 w-full items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-foreground transition-colors',
    'hover:bg-muted/60 hover:text-foreground'
  );

  const handleCopySongLink = useCallback(async () => {
    const url = absoluteSongShareUrl(transposedSong);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch (error) {
      console.error('Failed to copy song link:', error);
    }
  }, [transposedSong]);

  const shareButton = user ? (
    <ShareWithFriendIconButton
      entityType="song"
      entityId={transposedSong.id}
      entityTitle={transposedSong.title}
      className={
        isInLibrary
          ? cn(
              metaRowActionTileClass,
              'border-border/80 bg-muted/30 text-foreground hover:bg-muted/60 hover:text-foreground'
            )
          : guestShareClassName
      }
    />
  ) : (
    <button
      type="button"
      onClick={() => void handleCopySongLink()}
      className={guestShareClassName}
      aria-label={
        linkCopied ? t('songHeader.linkCopied') : t('songContent.shareThisSong')
      }
      title={
        linkCopied ? t('songHeader.linkCopied') : t('songContent.shareThisSong')
      }
    >
      {linkCopied ? (
        <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden />
      ) : (
        <ShareIcon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );

  const labeledActionButton = (
    label: string,
    button: React.ReactNode,
    showLabel = true
  ) =>
    showLabel ? (
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1">
        {button}
        <span className="text-center text-[10px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    ) : (
      button
    );

  const showActionLabels = !isInLibrary;

  const actionButtonsRow =
    isInLibrary &&
    (ratingDisplay ||
      viewsDisplay ||
      shareButton ||
      favoriteButton ||
      libraryToggleButton ||
      editButton) ? (
      <div className="flex w-full items-start gap-1.5 sm:gap-2">
        {viewsDisplay}
        {ratingDisplay}
        {favoriteButton
          ? labeledActionButton(
              isLiked ? t('library.removeFromFavorites') : t('library.addToFavorites'),
              favoriteButton,
              showActionLabels
            )
          : null}
        {libraryToggleButton
          ? labeledActionButton(
              isInLibrary ? t('library.removeFromLibrary') : t('library.addToLibrary'),
              libraryToggleButton,
              showActionLabels
            )
          : null}
        {editButton
          ? labeledActionButton(t('songHeader.edit'), editButton, showActionLabels)
          : null}
        {shareButton
          ? labeledActionButton(
              t('songContent.shareThisSong'),
              shareButton,
              showActionLabels
            )
          : null}
      </div>
    ) : null;

  const hasCollapsibleDetails =
    isInLibrary && (Boolean(actionButtonsRow) || Boolean(folderControl));

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
    <>
    <div 
      ref={contentRef}
      className={cn(
        'song-content-scrollable relative flex-1 min-h-0 overflow-x-hidden overflow-y-auto',
        youtubeTutorialOpen && youtubeVideoMode === 'audio'
          ? 'pb-24'
          : !isAuthenticated && 'pb-[5.5rem] sm:pb-24'
      )}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        width: '100%',
        maxWidth: '100%'
      }}
      onTouchStart={handleTouchStart}
    >
      <div className="bg-background px-3 py-4 sm:px-4 md:px-6">
        <div className="max-w-4xl mx-auto w-full space-y-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 sm:gap-2.5">
            {/* Row 1: cover (+ title/badges collapse when vignette expanded full width) */}
            <div className="flex w-full items-start gap-2">
              {songCoverVignette}
              {!coverExpanded ? (
                <>
                  <div className="min-w-0 flex-1 self-center">
                    {songTitleBlock}
                  </div>
                  {(capoDisplay || bpmDisplay) && (
                    <div className="flex shrink-0 items-start gap-1.5">
                      {capoDisplay}
                      {bpmDisplay}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Always-visible YouTube row — full width */}
            {youtubeActions}

            {/* Add to library (+ share when not in library) — outside collapsed */}
            {addToLibraryFullWidth || (!isInLibrary && shareButton) ? (
              <div className="flex w-full items-stretch gap-1.5">
                {addToLibraryFullWidth ? (
                  <div
                    className={cn(
                      'min-w-0',
                      !isInLibrary && shareButton ? 'flex-1' : 'w-full'
                    )}
                  >
                    {addToLibraryFullWidth}
                  </div>
                ) : null}
                {!isInLibrary && shareButton ? (
                  <div className="w-11 shrink-0 self-stretch sm:w-12">{shareButton}</div>
                ) : null}
              </div>
            ) : null}
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
            {!user && linkCopied ? (
              <p
                role="status"
                aria-live="polite"
                className="text-xs font-medium text-green-700 dark:text-green-400"
              >
                {t('songHeader.linkCopied')}
              </p>
            ) : null}

            {/* Slim full-width expand bar — only when already in library */}
            {hasCollapsibleDetails ? (
              <button
                type="button"
                onClick={() => setMetaDetailsOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-9"
                aria-expanded={metaDetailsOpen}
                aria-label={
                  metaDetailsOpen
                    ? t('songContent.hideDetails')
                    : t('songContent.showDetails')
                }
              >
                <ChevronDownIcon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 sm:h-4 sm:w-4',
                    metaDetailsOpen && 'rotate-180'
                  )}
                />
              </button>
            ) : null}

            {hasCollapsibleDetails && metaDetailsOpen ? (
              <div className="flex flex-col gap-2">
                {actionButtonsRow}
                {folderControl ? (
                  <div className="flex h-11 w-full items-center gap-1.5">
                    {folderControl}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <SongStoryCard
            songId={transposedSong.id}
            title={transposedSong.title}
            author={transposedSong.author ?? ''}
            tabId={transposedSong.tabId}
            genre={transposedSong.genre}
            songKey={transposedSong.key}
            chordProgression={transposedSong.chordProgression}
          />

          {/* Chord Diagrams Section - accordion */}
          <Collapsible
            open={chordSectionOpen}
            onOpenChange={handleChordSectionOpenChange}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  'flex w-full min-h-[48px] cursor-pointer select-none items-center justify-between gap-3 rounded-md bg-muted px-4 py-3 text-start font-semibold text-foreground touch-manipulation hover:bg-muted/80',
                  chordCollapseHint && 'ring-2 ring-primary/50 animate-pulse'
                )}
              >
                <div className="flex min-w-0 flex-col items-start gap-0.5">
                  <div className="flex min-w-0 items-center">
                    <MusicalNoteIcon className="me-2 h-5 w-5 shrink-0" />
                    <span className="truncate">{t('songContent.CHORDS_USED_TITLE')}</span>
                  </div>
                  {chordCollapseHint ? (
                    <span className="ps-7 text-xs font-normal text-muted-foreground">
                      {t('songContent.chordsSectionCollapsedHint')}
                    </span>
                  ) : null}
                </div>
                {onSetSelectedInstrument ? (
                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <InstrumentToggle
                      key={transposedSong.id}
                      value={selectedInstrument}
                      onChange={onSetSelectedInstrument}
                      compact
                      showLabels
                      className="shrink-0"
                    />
                  </div>
                ) : null}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-2.5">
                <div className="relative">
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

                  {onSetSelectedInstrument ? (
                    <InstrumentSwitchHint
                      className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-2"
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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

                <PracticeComingSoonChip
                  visible={hasLyricPractice}
                  practiceAvailable={hasLyricPractice}
                  onStartPractice={
                    hasLyricPractice ? onStartLyricPracticeTutorial : undefined
                  }
                />
                {isAuthenticated ? (
                  <RecordSongChip
                    visible={recordPromoPhase === 'chip'}
                    onDismiss={dismissRecordPromo}
                  />
                ) : null}
                </div>

                {isAuthenticated && SONG_RECORDING_ENABLED ? (
                  <SongRecordingPanel
                    songId={transposedSong.id}
                    lineCount={practiceLineCount}
                    hidePromoBanner
                    showFallbackStart={false}
                    onControlsReady={handleRecordControlsReady}
                    onRecordingReady={(recording, playbackUrl) => {
                      setSelectedRecording(recording);
                      setRecordingPlaybackUrl(playbackUrl);
                      if (recording && recording.lineMarkers.length > 0 && playbackUrl) {
                        setPracticeMode(true);
                        setPracticeLineIndex(0);
                      }
                    }}
                  />
                ) : null}

              </div>
            </CollapsibleContent>
          </Collapsible>

          {sheetImageUrl ? (
            <Collapsible
              open={sheetSectionOpen}
              onOpenChange={setSheetSectionOpen}
              className="mb-4"
            >
              <CollapsibleTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full min-h-[48px] cursor-pointer select-none items-center justify-between gap-3 rounded-md bg-muted px-4 py-3 text-start font-semibold text-foreground touch-manipulation hover:bg-muted/80"
                >
                  <div className="flex min-w-0 items-center">
                    <DocumentTextIcon className="me-2 h-5 w-5 shrink-0" />
                    <span className="truncate">{t('songContent.SHEET_MUSIC_TITLE')}</span>
                  </div>
                  {sheetSectionOpen ? (
                    <ChevronUpIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-3">
                  <a
                    href={sheetImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-border bg-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sheetImageUrl}
                      alt={t('songContent.SHEET_MUSIC_ALT').replace(
                        '{title}',
                        transposedSong.title ?? ''
                      )}
                      className="h-auto w-full object-contain"
                      loading="lazy"
                    />
                  </a>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          {practiceMode && !landscapePracticeActive ? (
            <PracticeModeBar
              lineIndex={practiceLineIndex}
              lineCount={practiceLineCount}
              isPlaying={useRecordingPractice ? practiceAudio.isPlaying : practicePlaying}
              onPrev={() => seekPracticeToLine(practiceLineIndex - 1)}
              onNext={() => seekPracticeToLine(practiceLineIndex + 1)}
              onTogglePlay={togglePracticePlay}
              onExit={exitPracticeMode}
            />
          ) : null}

          {/* Song Content — portrait practice chrome; landscape uses fullscreen overlay */}
          {!landscapePracticeActive ? (
            <StructuredSongContent
              song={transposedSong}
              onChordClick={onChordClick}
              fontSize={fontSize}
              practiceMode={practiceMode}
              practiceLineIndex={practiceLineIndex}
              youtubeLyricSeekEnabled={youtubeLyricSeekEnabled}
              youtubeLyricSyncLookup={youtubeLyricSyncLookup}
              youtubeActiveLyricKey={youtubeActiveLyricKey}
              onYoutubeLyricLineClick={onYoutubeLyricLineClick}
              autoScrollIsActive={autoScrollIsActive}
            />
          ) : null}

          {landscapePracticeActive ? (
            <LandscapePracticeView
              songTitle={transposedSong?.title ?? ''}
              lines={practiceLines}
              activeLineIndex={practiceLineIndex}
              lineCount={practiceLineCount}
              isPlaying={useRecordingPractice ? practiceAudio.isPlaying : practicePlaying}
              onPrev={() => seekPracticeToLine(practiceLineIndex - 1)}
              onNext={() => seekPracticeToLine(practiceLineIndex + 1)}
              onTogglePlay={togglePracticePlay}
              onExit={exitPracticeMode}
            />
          ) : null}

          {isAuthenticated ? (
            <div ref={endSuggestionsRef}>
              <SongEndSuggestions
                currentSongId={transposedSong.id}
                currentAuthor={transposedSong.author ?? ''}
                currentGenre={transposedSong.genre}
                nextSong={nextSong}
                onPlayNext={onPlayNext}
              />
            </div>
          ) : null}

          {onOpenSongQueue ? (
            <button
              type="button"
              onClick={onOpenSongQueue}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 active:bg-muted sm:hidden"
              aria-label={t('songHeader.openSongQueue')}
            >
              <ChevronUpIcon className="h-5 w-5 shrink-0" />
              <span>{t('songHeader.openSongQueue')}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
    {!isAuthenticated ? (
      <SignInPromoBanner onSignIn={() => void signInWithGoogle(pathname)} />
    ) : null}
    </>
  );
}

// Structured song content renderer
interface StructuredSongContentProps {
  song: any;
  onChordClick: (chord: string) => void;
  fontSize: number;
  practiceMode?: boolean;
  practiceLineIndex?: number;
  youtubeLyricSeekEnabled?: boolean;
  youtubeLyricSyncLookup?: Map<string, { startSec: number | null }>;
  youtubeActiveLyricKey?: string | null;
  onYoutubeLyricLineClick?: (sectionIndex: number, lineIndex: number) => void;
  autoScrollIsActive?: boolean;
}

function PracticeModeBar({
  lineIndex,
  lineCount,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
  onExit,
}: {
  lineIndex: number;
  lineCount: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onExit: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 rounded-xl border border-primary/20 bg-background/95 px-3 py-2 shadow-sm backdrop-blur-md">
      <button
        type="button"
        onClick={onPrev}
        disabled={lineIndex <= 0}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 text-foreground disabled:opacity-40"
        aria-label={t('songContent.practicePrev')}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        aria-label={isPlaying ? t('songContent.practicePause') : t('songContent.practicePlay')}
      >
        {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={lineIndex >= lineCount - 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 text-foreground disabled:opacity-40"
        aria-label={t('songContent.practiceNext')}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
      <span className="ms-1 min-w-0 flex-1 truncate text-xs font-medium tabular-nums text-muted-foreground">
        {lineIndex + 1} / {lineCount}
      </span>
      <button
        type="button"
        onClick={onExit}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {t('songContent.practiceExit')}
      </button>
    </div>
  );
}

function StructuredSongContent({
  song,
  onChordClick,
  fontSize,
  practiceMode = false,
  practiceLineIndex = 0,
  youtubeLyricSeekEnabled = false,
  youtubeLyricSyncLookup,
  youtubeActiveLyricKey = null,
  onYoutubeLyricLineClick,
  autoScrollIsActive = false,
}: StructuredSongContentProps) {
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
    // View mode: all sections expanded. Edit mode collapses to first verse only.
    const open = new Set<number>();
    song.sections.forEach((s: { name: string }, i: number) => {
      if (s.name !== 'Version Description') open.add(i);
    });
    return open;
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

  const renderSongLine = (
    line: any,
    lineIndex: number,
    globalLineIndex?: number,
    sectionIndex?: number
  ) => {
    const optimalFontSize = getOptimalFontSize(fontSize);
    const optimalLineHeight = getOptimalLineHeight(optimalFontSize);
    const isHebrewLine = containsHebrew(line.lyrics ?? line.chord_line ?? '');
    const lyricsFontFamily = getSongLyricsFontFamily(isHebrewLine);
    const chordFontFamily = getSongChordFontFamily();
    const isPracticeActive =
      practiceMode && typeof globalLineIndex === 'number' && globalLineIndex === practiceLineIndex;
    const isPracticeDimmed =
      practiceMode && typeof globalLineIndex === 'number' && globalLineIndex !== practiceLineIndex;

    const lyricKey =
      typeof sectionIndex === 'number' ? `${sectionIndex}:${lineIndex}` : null;
    const syncTimed =
      youtubeLyricSeekEnabled &&
      lyricKey != null &&
      youtubeLyricSyncLookup?.get(lyricKey)?.startSec != null;
    const isYoutubeActive = youtubeLyricSeekEnabled && lyricKey != null && youtubeActiveLyricKey === lyricKey;

    let content: React.ReactNode = null;
    
    if (line.type === 'lyrics_only') {
      content = (
        <div className="text-foreground min-h-[1.8rem] break-words w-full" dir={getTextDirection(line.lyrics)} style={{ 
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
    } else if (line.type === 'chords_only') {
      content = (
        <div dir={songTextDirection} className="text-blue-600 dark:text-blue-400 font-semibold min-h-[1.8rem] break-words w-full" style={{ 
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
    } else if (line.type === 'chord_over_lyrics' && line.chords && line.lyrics) {
      content = (
        <ChordOverLyricsLine 
          line={line}
          fontSize={optimalFontSize}
          onChordClick={onChordClick}
        />
      );
    }

    if (!content) return null;

    const lineShell = (
      <div
        key={lineIndex}
        data-practice-line={globalLineIndex}
        data-lyric-key={lyricKey ?? undefined}
        className={cn(
          'rounded-md transition-[background-color,opacity] duration-200',
          isPracticeActive && 'w-full rounded-lg bg-muted/35 py-1 dark:bg-muted/25',
          isPracticeDimmed && 'opacity-30',
          isYoutubeActive &&
            'border-s-[3px] border-s-foreground/55 bg-muted/90 px-2.5 py-1.5 ring-1 ring-border/70',
          syncTimed && !isYoutubeActive && 'cursor-pointer hover:bg-muted/50',
          syncTimed && isYoutubeActive && 'cursor-pointer',
          isYoutubeActive && 'scroll-mt-32 scroll-mb-48'
        )}
        onClick={
          syncTimed && typeof sectionIndex === 'number'
            ? () => onYoutubeLyricLineClick?.(sectionIndex, lineIndex)
            : undefined
        }
        role={syncTimed ? 'button' : undefined}
        tabIndex={syncTimed ? 0 : undefined}
        onKeyDown={
          syncTimed && typeof sectionIndex === 'number'
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onYoutubeLyricLineClick?.(sectionIndex, lineIndex);
                }
              }
            : undefined
        }
      >
        {content}
      </div>
    );

    return lineShell;
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
          className="hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
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

  const renderSectionLines = (lines: any[], sectionStartIndex: number, sectionIndex: number) => {
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
                renderSongLine(
                  line,
                  group.startIndex + lineIndex,
                  sectionStartIndex + group.startIndex + lineIndex,
                  sectionIndex
                )
              )}
            </div>
          </div>
        );
      }

      return group.lines.map((line, lineIndex) =>
        renderSongLine(
          line,
          group.startIndex + lineIndex,
          sectionStartIndex + group.startIndex + lineIndex,
          sectionIndex
        )
      );
    });
  };
  
  useEffect(() => {
    if (!practiceMode && !youtubeLyricSeekEnabled) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      song.sections.forEach((s: { name: string }, i: number) => {
        if (s.name !== 'Version Description') next.add(i);
      });
      return next;
    });
  }, [practiceMode, youtubeLyricSeekEnabled, song.sections]);

  useEffect(() => {
    if (!practiceMode) return;
    const el = document.querySelector(`[data-practice-line="${practiceLineIndex}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [practiceMode, practiceLineIndex]);

  // Follow YouTube / audio practice sync: keep the active timed lyric in view.
  // Skip when header continuous autoscroll is driving scroll (mutual exclusion).
  useEffect(() => {
    if (autoScrollIsActive) return;
    if (!youtubeLyricSeekEnabled || !youtubeActiveLyricKey) return;

    const sectionPart = youtubeActiveLyricKey.split(':')[0];
    const sectionIndex = Number(sectionPart);
    if (Number.isFinite(sectionIndex)) {
      setOpenSections((prev) => {
        if (prev.has(sectionIndex)) return prev;
        const next = new Set(prev);
        next.add(sectionIndex);
        return next;
      });
    }

    let cancelled = false;
    let raf2 = 0;

    const scrollToActive = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-lyric-key="${youtubeActiveLyricKey}"]`);
      if (!(el instanceof HTMLElement)) return;

      const rect = el.getBoundingClientRect();
      const viewTop = 96;
      const viewBottom = window.innerHeight - 160;
      const fullyComfortable = rect.top >= viewTop && rect.bottom <= viewBottom;
      if (fullyComfortable) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };

    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(scrollToActive);
    });
    const fallback = window.setTimeout(scrollToActive, 140);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(fallback);
    };
  }, [autoScrollIsActive, youtubeLyricSeekEnabled, youtubeActiveLyricKey]);

  const sectionStartOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (const section of song.sections as Array<{ name: string; lines?: unknown[] }>) {
      offsets.push(running);
      if (section.name !== 'Version Description') {
        running += Array.isArray(section.lines) ? section.lines.length : 0;
      }
    }
    return offsets;
  }, [song.sections]);

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
                className="w-full cursor-pointer select-none touch-manipulation rounded-md bg-muted px-3 py-2.5 text-start font-medium text-foreground hover:bg-muted/80"
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
                {renderSectionLines(section.lines, sectionStartOffsets[sectionIndex] ?? 0, sectionIndex)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
