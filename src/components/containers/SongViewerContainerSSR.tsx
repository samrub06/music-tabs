'use client';

import { Song, Chord } from '@/types';
import { transposeStructuredSong, renderStructuredSong } from '@/utils/structuredSong';
import { useRouter } from 'next/navigation';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import SongViewer from '../presentational/SongViewer';
import { getDefaultToolsBarHeight } from '../presentational/ToolsBottomBar';
import { useSongEditor } from '@/lib/hooks/useSongEditor';
import { useAutoScroll } from '@/lib/hooks/useAutoScroll';
import { useChordDiagram } from '@/lib/hooks/useChordDiagram';
import { useFontSize } from '@/lib/hooks/useFontSize';
import { useMetronome } from '@/lib/hooks/useMetronome';
import { songRepo } from '@/lib/services/songRepo';
import { supabase } from '@/lib/supabase';
import { DEFAULT_AUTO_SCROLL_SPEED } from '@/utils/autoScrollSpeed';
import { findBestEasyChordTransposition } from '@/utils/chordDifficulty';
import { knownChordService } from '@/lib/services/knownChordService';
import { chordService } from '@/lib/services/chordService';
import {
  recordSongViewAction,
  completeSongProgressAction,
  toggleSongFavoriteAction,
} from '@/app/song/[id]/actions';
import { xpLog } from '@/utils/xpLog';
import { triggerXpConfetti } from '@/utils/triggerXpConfetti';
import { mountXpCelebration } from '@/utils/mountXpCelebration';
import type { SongProgressResult } from '@/types';
import { updateSongFolderAction, cloneSongAction } from '@/app/(protected)/dashboard/actions';
import { deleteSongAction } from '@/app/song/[id]/actions';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useFoldersContext } from '@/context/FoldersContext';

const CELEBRATION_NAV_DELAY_MS = 1100;

interface SongViewerContainerSSRProps {
  song: Song;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  isAuthenticated?: boolean;
  isInLibrary?: boolean;
  isOwnedByUser?: boolean;
  librarySongId?: string;
  canEdit?: boolean;
  onAddToLibrary?: () => void;
  initialInstrument?: 'piano' | 'guitar';
}

export default function SongViewerContainerSSR({ 
  song, 
  onUpdate,
  onDelete,
  isAuthenticated = false,
  isInLibrary = true,
  isOwnedByUser = true,
  librarySongId,
  canEdit = true,
  onAddToLibrary,
  initialInstrument,
}: SongViewerContainerSSRProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Local state instead of AppContext; initial value from user profile preference
  const [selectedInstrument, setSelectedInstrument] = useState<'piano' | 'guitar'>(initialInstrument ?? 'piano');
  const [transposeValue, setTransposeValue] = useState(0);
  const [easyChordMode, setEasyChordMode] = useState(false);
  const [savedTransposeValue, setSavedTransposeValue] = useState(0);
  const [autoScroll, setAutoScroll] = useState({
    isActive: false,
    speed: DEFAULT_AUTO_SCROLL_SPEED,
  });
  const [useCapo, setUseCapo] = useState<boolean>(song.capo !== undefined && song.capo !== null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [manualBpm, setManualBpm] = useState<number | null>(null);
  const [hasUsedNext, setHasUsedNext] = useState(false);
  const [nextSongInfo, setNextSongInfo] = useState<{
    id: string;
    title: string;
    author?: string;
    songImageUrl?: string;
    artistImageUrl?: string;
  } | null>(null);
  const [isFromPlaylist, setIsFromPlaylist] = useState(false);
  const [playlistTargetKey, setPlaylistTargetKey] = useState<string | null>(null);
  const [knownChordIds, setKnownChordIds] = useState<Set<string>>(new Set());
  const [chordNameToIdMap, setChordNameToIdMap] = useState<Map<string, string>>(new Map());
  const [chords, setChords] = useState<Chord[]>([]);
  const [isLiked, setIsLiked] = useState(song.isLiked ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const chordsLoadedRef = useRef(false);
  const viewRecordedForSongIdRef = useRef<string | null>(null);
  const xpAwardInFlightRef = useRef(false);
  const endProgressAttemptedRef = useRef<string | null>(null);
  const { folders } = useFoldersContext();
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    song.folderId
  );

  useEffect(() => {
    setIsLiked(song.isLiked ?? false);
  }, [song.id, song.isLiked]);

  useEffect(() => {
    setCurrentFolderId(song.folderId);
  }, [song.id, song.folderId]);

  const [localIsInLibrary, setLocalIsInLibrary] = useState(isInLibrary);
  const [localLibrarySongId, setLocalLibrarySongId] = useState(librarySongId);

  useEffect(() => {
    setLocalIsInLibrary(isInLibrary);
    setLocalLibrarySongId(librarySongId);
  }, [song.id, isInLibrary, librarySongId]);

  const librarySongIdForActions = localLibrarySongId ?? (isOwnedByUser ? song.id : undefined);

  const handleFolderChange = async (folderId: string | undefined) => {
    if (!librarySongIdForActions) return;
    await updateSongFolderAction(librarySongIdForActions, folderId);
    setCurrentFolderId(folderId);
  };

  const handleToggleFavorite = async () => {
    if (!librarySongIdForActions) return;
    setIsTogglingFavorite(true);
    try {
      const { isLiked: next } = await toggleSongFavoriteAction(librarySongIdForActions);
      setIsLiked(next);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [isRemovingFromLibrary, setIsRemovingFromLibrary] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [libraryActionFeedback, setLibraryActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!libraryActionFeedback) return;
    const timer = window.setTimeout(() => setLibraryActionFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [libraryActionFeedback]);

  const handleAddToLibrary = async () => {
    if (onAddToLibrary) {
      onAddToLibrary();
      return;
    }
    if (!isAuthenticated || localIsInLibrary) return;

    setIsAddingToLibrary(true);
    setLibraryActionFeedback(null);
    try {
      const created = await cloneSongAction(song.id);
      setLocalIsInLibrary(true);
      setLocalLibrarySongId(created.id);
      setLibraryActionFeedback({
        type: 'success',
        message: t('library.addedToLibrary'),
      });
    } catch (error) {
      console.error('Failed to add song to library:', error);
      setLibraryActionFeedback({
        type: 'error',
        message: t('errors.failedToSave'),
      });
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!isAuthenticated || !localIsInLibrary) return;

    const idToDelete = localLibrarySongId ?? (isOwnedByUser ? song.id : undefined);
    if (!idToDelete) return;

    setIsRemovingFromLibrary(true);
    setLibraryActionFeedback(null);
    try {
      await deleteSongAction(idToDelete);
      setRemoveDialogOpen(false);
      if (isOwnedByUser || idToDelete === song.id) {
        router.push('/songs');
        return;
      }
      setLocalIsInLibrary(false);
      setLocalLibrarySongId(undefined);
      setLibraryActionFeedback({
        type: 'success',
        message: t('library.removedFromLibrary'),
      });
    } catch (error) {
      console.error('Failed to remove song from library:', error);
      setLibraryActionFeedback({
        type: 'error',
        message: t('errors.failedToSave'),
      });
    } finally {
      setIsRemovingFromLibrary(false);
    }
  };

  const requestRemoveFromLibrary = () => {
    if (!isAuthenticated || !localIsInLibrary) return;
    setRemoveDialogOpen(true);
  };

  // Load hasUsedNext from sessionStorage on mount and sync current song index
  // Also check for playlist context and apply automatic transposition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hasUsedNext');
      setHasUsedNext(stored === 'true');
      
      // Sync current song index in navigation data and check for playlist context
      const navigationDataStr = sessionStorage.getItem('songNavigation');
      if (navigationDataStr) {
        try {
          const navigationData = JSON.parse(navigationDataStr);
          const { songList, playlistContext } = navigationData;
          const currentIndex = songList.findIndex((id: string) => id === song.id);
          
          // Check if we're in a playlist context
          if (playlistContext && playlistContext.isPlaylist) {
            setIsFromPlaylist(true);
            setPlaylistTargetKey(playlistContext.targetKey || null);
            
            // Find the current song's key adjustment
            const currentSongData = playlistContext.songs.find((s: any) => s.id === song.id);
            if (currentSongData && currentSongData.keyAdjustment !== undefined) {
              // Apply the key adjustment automatically
              setTransposeValue(currentSongData.keyAdjustment);
              console.log(`Applied playlist transposition: ${currentSongData.keyAdjustment} semitones for song ${song.id}`);
            }
          }
          
          if (currentIndex >= 0 && currentIndex !== navigationData.currentIndex) {
            // Update index if it doesn't match
            const updatedData = {
              ...navigationData,
              currentIndex
            };
            sessionStorage.setItem('songNavigation', JSON.stringify(updatedData));
          }
          
          // Load next song info if available (prefer playlist context to avoid extra fetch)
          if (currentIndex >= 0 && currentIndex < songList.length - 1) {
            const nextSongId = songList[currentIndex + 1];
            const nextFromPlaylist = playlistContext?.songs?.find(
              (s: { id: string }) => s.id === nextSongId
            );

            if (nextFromPlaylist?.title) {
              setNextSongInfo({
                id: nextFromPlaylist.id,
                title: nextFromPlaylist.title,
                author: nextFromPlaylist.author,
                songImageUrl: nextFromPlaylist.songImageUrl,
                artistImageUrl: nextFromPlaylist.artistImageUrl,
              });
            } else {
              const repo = songRepo(supabase);
              repo.getSongInfo(nextSongId).then(nextSong => {
                if (nextSong) {
                  setNextSongInfo({
                    id: nextSong.id,
                    title: nextSong.title,
                    author: nextSong.author,
                    songImageUrl: nextSong.songImageUrl,
                    artistImageUrl: nextSong.artistImageUrl,
                  });
                }
              }).catch(err => {
                console.error('Error loading next song info:', err);
              });
            }
          } else {
            setNextSongInfo(null);
          }
        } catch (error) {
          console.error('Error syncing navigation data:', error);
        }
      }
    }
  }, [song.id]);

  // Custom hooks
  const {
    isEditing,
    editSections,
    isSaving,
    updateLine,
    addSection,
    deleteSection,
    addLine,
    deleteLine,
    moveLine,
    handleSave,
    handleCancelEdit,
    handleToggleEdit
  } = useSongEditor({ song, updateSong: onUpdate, getMessage: t });

  const { selectedChord, showChordDiagram, handleChordClick, handleCloseChordDiagram } = useChordDiagram();
  
  const { fontSize, setFontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSize();
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync useCapo state when song changes
  useEffect(() => {
    setUseCapo(song.capo !== undefined && song.capo !== null);
  }, [song.capo]);

  // Reset saved transpose value when song changes
  useEffect(() => {
    setSavedTransposeValue(0);
  }, [song.id]);

  // Record view once per song (guards React Strict Mode double-mount in dev)
  useEffect(() => {
    if (viewRecordedForSongIdRef.current === song.id) return
    viewRecordedForSongIdRef.current = song.id

    recordSongViewAction(song.id)
      .then(() => {
        xpLog('view_count_recorded', { songId: song.id });
      })
      .catch((error) => {
        console.error('Failed to record song view:', error);
      });
  }, [song.id]);

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

  useEffect(() => {
    chordsLoadedRef.current = false;
    setChords([]);
    setKnownChordIds(new Set());
    setChordNameToIdMap(new Map());
  }, [song.id]);

  // Load chord catalog in background (non-blocking) for diagram interactions
  useEffect(() => {
    if (!isAuthenticated || chordsLoadedRef.current) {
      return;
    }

    let cancelled = false;

    const loadChords = async () => {
      try {
        const allChords = await chordService.getAllChords(supabase);
        if (cancelled) return;

        setChords(allChords);
        chordsLoadedRef.current = true;

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) {
          return;
        }

        const nameToIdMap = new Map<string, string>();
        allChords.forEach((chord) => {
          const normalized = normalizeChordName(chord.name);
          nameToIdMap.set(normalized, chord.id);
        });
        setChordNameToIdMap(nameToIdMap);

        const knownChordIdsArray = await knownChordService.getKnownChordIds(user.id, supabase);
        if (!cancelled) {
          setKnownChordIds(new Set(knownChordIdsArray));
        }
      } catch (error) {
        console.error('Error loading chords:', error);
        if (!cancelled) {
          setKnownChordIds(new Set());
          setChordNameToIdMap(new Map());
          setChords([]);
        }
      }
    };

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 200);

    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout;

    let idleId: number | undefined;
    idleId = schedule(() => {
      if (!cancelled) loadChords();
    }) as number;

    return () => {
      cancelled = true;
      if (idleId !== undefined) cancel(idleId);
    };
  }, [isAuthenticated, song.id]);

  // Auto-scroll functionality
  useAutoScroll({ 
    isActive: autoScroll.isActive, 
    speed: autoScroll.speed, 
    toggleAutoScroll: () => setAutoScroll(prev => ({ ...prev, isActive: !prev.isActive })),
    contentRef
  });

  // Metronome functionality
  useMetronome({
    bpm: manualBpm || song.bpm,
    isActive: metronomeActive,
    onToggle: () => setMetronomeActive(prev => !prev)
  });

  // Business logic handlers
  const handleDelete = () => {
    if (confirm(t('songs.confirmDeleteSong'))) {
      onDelete(song.id);
      router.push('/songs');
    }
  };

  const handleToggleAutoScroll = () => {
    setAutoScroll(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    const doc = typeof document !== 'undefined' ? document.scrollingElement || document.documentElement : null;
    if (doc) {
      doc.scrollTop = 0;
    }
  };

  const handleToggleCapo = (value: boolean) => {
    setUseCapo(value);
  };

  // Navigation handlers
  const handleNavigateBack = () => {
    if (typeof window === 'undefined') {
      router.push('/songs')
      return
    }

    const navigationDataStr = sessionStorage.getItem('songNavigation')
    if (navigationDataStr) {
      try {
        const navigationData = JSON.parse(navigationDataStr)
        if (navigationData.sourceUrl) {
          router.push(navigationData.sourceUrl)
          return
        }
      } catch (error) {
        console.error('Error parsing navigation data:', error)
      }
    }

    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/songs')
    }
  }

  const runCompleteProgress = useCallback(
    async (trigger: 'next' | 'end_reached'): Promise<SongProgressResult | null> => {
      if (xpAwardInFlightRef.current) {
        xpLog('next_blocked_in_flight', { songId: song.id, trigger });
        return null;
      }

      xpAwardInFlightRef.current = true;
      xpLog('complete_started', { songId: song.id, trigger });

      try {
        const result = await completeSongProgressAction(song.id);

        if (result.awarded) {
          xpLog('complete_awarded', {
            songId: song.id,
            xpAmount: result.xpAmount,
            levelUp: result.levelUp,
          });
          mountXpCelebration({
            xpLabel: t('gamification.XP_EARNED').replace('{amount}', String(result.xpAmount)),
            levelUp: result.levelUp,
            levelUpLabel: t('gamification.LEVEL_UP'),
          });
          triggerXpConfetti(result.levelUp ? 'levelUp' : 'standard');
          await new Promise((resolve) => setTimeout(resolve, CELEBRATION_NAV_DELAY_MS));
        } else {
          xpLog('complete_skipped', { songId: song.id, reason: result.reason, trigger });
        }

        return result;
      } finally {
        xpAwardInFlightRef.current = false;
      }
    },
    [song.id, t]
  );

  const handleNextSong = async () => {
    if (typeof window === 'undefined') return;

    if (xpAwardInFlightRef.current) {
      xpLog('next_blocked_in_flight', { songId: song.id });
      return;
    }

    const navigationDataStr = sessionStorage.getItem('songNavigation');
    if (!navigationDataStr) return;

    try {
      const navigationData = JSON.parse(navigationDataStr);
      const { songList, currentIndex } = navigationData;

      if (currentIndex < songList.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextSongId = songList[nextIndex];

        await runCompleteProgress('next');

        const updatedData = {
          ...navigationData,
          currentIndex: nextIndex,
        };
        sessionStorage.setItem('songNavigation', JSON.stringify(updatedData));

        sessionStorage.setItem('hasUsedNext', 'true');
        setHasUsedNext(true);

        xpLog('next_navigate', {
          from: song.id,
          to: nextSongId,
          delayMs: CELEBRATION_NAV_DELAY_MS,
        });

        router.replace(`/song/${nextSongId}`);
      }
    } catch (error) {
      console.error('Error parsing navigation data:', error);
    }
  };

  const handleReachSongEnd = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem('songNavigation')) return;
    if (endProgressAttemptedRef.current === song.id) return;

    endProgressAttemptedRef.current = song.id;
    await runCompleteProgress('end_reached');
  }, [song.id, runCompleteProgress]);

  const handlePrevSong = () => {
    if (!hasUsedNext) return;
    
    // Use browser history to go back
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  // Calculate navigation availability
  const canNextSong = (() => {
    if (typeof window === 'undefined') return false;
    
    const navigationDataStr = sessionStorage.getItem('songNavigation');
    if (!navigationDataStr) return false;
    
    try {
      const navigationData = JSON.parse(navigationDataStr);
      const { songList, currentIndex } = navigationData;
      return currentIndex < songList.length - 1;
    } catch {
      return false;
    }
  })();

  const canPrevSong = hasUsedNext;

  const canAwardOnEndReach =
    !canNextSong &&
    typeof window !== 'undefined' &&
    !!sessionStorage.getItem('songNavigation');

  // Handle Easy Chord Mode
  useEffect(() => {
    if (easyChordMode && song.allChords) {
      // Calculate best transposition for easy chords
      const bestTransposition = findBestEasyChordTransposition(song.allChords);
      setTransposeValue(bestTransposition.semitones);
    } else if (!easyChordMode) {
      // Restore saved transpose value when mode is disabled
      setTransposeValue(savedTransposeValue);
    }
  }, [easyChordMode, song.allChords, savedTransposeValue, song.id]);

  // Handle manual transpose changes
  const handleSetTransposeValue = (value: number) => {
    if (easyChordMode) {
      // If user manually changes transpose while easy chord mode is on, disable the mode
      setEasyChordMode(false);
    }
    // Save the manual change
    setSavedTransposeValue(value);
    setTransposeValue(value);
  };

  // Transpose song for display
  // When "no capo" is selected, transpose down by capo amount to compensate
  const effectiveTranspose = transposeValue - (useCapo ? 0 : (song.capo || 0));
  const transposedSong = transposeStructuredSong(song, effectiveTranspose);
  const transposedContent = renderStructuredSong(transposedSong, {
    maxWidth: 80,
    wordWrap: true,
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768
  });

  // Props for presentation component
  const songViewerProps = {
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
    metronome: {
      isActive: metronomeActive,
      bpm: manualBpm || song.bpm || null
    },
    manualBpm,
    onSetManualBpm: setManualBpm,
    onToggleMetronome: () => setMetronomeActive(prev => !prev),
    contentRef,
    onUpdateLine: updateLine,
    onAddSection: addSection,
    onDeleteSection: deleteSection,
    onAddLine: addLine,
    onDeleteLine: deleteLine,
    onMoveLine: moveLine,
    onSave: handleSave,
    onDelete: canEdit ? handleDelete : undefined,
    onChordClick: handleChordClick,
    onToggleAutoScroll: handleToggleAutoScroll,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
    onResetFontSize: resetFontSize,
    onResetScroll: resetScroll,
    onCancelEdit: handleCancelEdit,
    onToggleEdit: canEdit ? handleToggleEdit : undefined,
    onCloseChordDiagram: handleCloseChordDiagram,
    onSetSelectedInstrument: setSelectedInstrument,
    onSetTransposeValue: handleSetTransposeValue,
    onSetAutoScrollSpeed: (speed: number) => setAutoScroll(prev => ({ ...prev, speed })),
    easyChordMode,
    onToggleEasyChordMode: () => setEasyChordMode(prev => !prev),
    useCapo,
    onToggleCapo: handleToggleCapo,
    onNavigateBack: handleNavigateBack,
    onPrevSong: handlePrevSong,
    onNextSong: handleNextSong,
    canPrevSong: canPrevSong,
    canNextSong: canNextSong,
    nextSongInfo: nextSongInfo,
    onPlayNext: handleNextSong,
    onReachSongEnd: canAwardOnEndReach ? handleReachSongEnd : undefined,
    canAwardOnEndReach,
    isAuthenticated,
    knownChordIds,
    chordNameToIdMap,
    chords,
    isInLibrary: localIsInLibrary,
    isOwnedByUser,
    librarySongId: localLibrarySongId,
    isLiked,
    onAddToLibrary: handleAddToLibrary,
    isAddingToLibrary,
    onRemoveFromLibrary: requestRemoveFromLibrary,
    isRemovingFromLibrary,
    libraryActionFeedback,
    onToggleFavorite: localIsInLibrary ? handleToggleFavorite : undefined,
    isTogglingFavorite,
    onFontSizeChange: setFontSize,
    bottomBarHeight,
    setBottomBarHeight,
    onToggleToolsBar: () =>
      setBottomBarHeight((prev) => (prev > 0 ? 0 : getDefaultToolsBarHeight())),
    folders: localIsInLibrary && librarySongIdForActions ? folders : [],
    currentFolderId,
    onFolderChange: localIsInLibrary && librarySongIdForActions ? handleFolderChange : undefined,
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <SongViewer {...songViewerProps} />
      <ConfirmActionDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title={
          isOwnedByUser
            ? t('songs.confirmDeleteSong')
            : t('library.confirmRemoveFromLibrary')
        }
        description={
          isOwnedByUser
            ? t('songs.confirmDeleteSongMessage')
            : t('library.confirmRemoveFromLibraryMessage')
        }
        confirmLabel={isOwnedByUser ? t('songs.delete') : t('library.removeFromLibrary')}
        onConfirm={handleRemoveFromLibrary}
        isPending={isRemovingFromLibrary}
        destructive
      />
    </div>
  );
}

