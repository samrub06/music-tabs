'use client';

import { Song } from '@/types';
import { transposeStructuredSong, renderStructuredSong } from '@/utils/structuredSong';
import { useRouter } from 'next/navigation';
import React, { useRef, useEffect, useState } from 'react';
import SongViewer from '../presentational/SongViewer';
import { useSongEditor } from '@/lib/hooks/useSongEditor';
import { useAutoScroll } from '@/lib/hooks/useAutoScroll';
import { useChordDiagram } from '@/lib/hooks/useChordDiagram';
import { useFontSize } from '@/lib/hooks/useFontSize';
import { useMetronome } from '@/lib/hooks/useMetronome';
import { songService } from '@/lib/services/songService';
import { supabase } from '@/lib/supabase';
import { calculateSpeedFromBPM } from '@/utils/autoScrollSpeed';

interface SongViewerContainerSSRProps {
  song: Song;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  isAuthenticated?: boolean;
}

export default function SongViewerContainerSSR({ 
  song, 
  onUpdate,
  onDelete,
  isAuthenticated = false
}: SongViewerContainerSSRProps) {
  const router = useRouter();

  // Local state instead of AppContext
  const [selectedInstrument, setSelectedInstrument] = useState<'piano' | 'guitar'>('piano');
  const [transposeValue, setTransposeValue] = useState(0);
  const [autoScroll, setAutoScroll] = useState({ 
    isActive: false, 
    speed: calculateSpeedFromBPM(song.bpm) 
  });
  const [useCapo, setUseCapo] = useState<boolean>(song.capo !== undefined && song.capo !== null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [manualBpm, setManualBpm] = useState<number | null>(null);
  const [hasUsedNext, setHasUsedNext] = useState(false);
  
  // Load hasUsedNext from sessionStorage on mount and sync current song index
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hasUsedNext');
      setHasUsedNext(stored === 'true');
      
      // Sync current song index in navigation data
      const navigationDataStr = sessionStorage.getItem('songNavigation');
      if (navigationDataStr) {
        try {
          const navigationData = JSON.parse(navigationDataStr);
          const { songList } = navigationData;
          const currentIndex = songList.findIndex(id => id === song.id);
          
          if (currentIndex >= 0 && currentIndex !== navigationData.currentIndex) {
            // Update index if it doesn't match
            const updatedData = {
              ...navigationData,
              currentIndex
            };
            sessionStorage.setItem('songNavigation', JSON.stringify(updatedData));
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
    editContent,
    isSaving,
    setEditContent,
    handleSave,
    handleCancelEdit,
    handleToggleEdit
  } = useSongEditor({ song, updateSong: onUpdate });

  const { selectedChord, showChordDiagram, handleChordClick, handleCloseChordDiagram } = useChordDiagram();
  
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSize();
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync useCapo state when song changes
  useEffect(() => {
    setUseCapo(song.capo !== undefined && song.capo !== null);
  }, [song.capo]);

  // Update auto-scroll speed when song BPM changes
  useEffect(() => {
    const newSpeed = calculateSpeedFromBPM(song.bpm);
    setAutoScroll(prev => ({ 
      ...prev, 
      speed: newSpeed 
    }));
  }, [song.bpm]);

  // Increment view count when component mounts
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await songService.incrementViewCount(song.id, supabase);
        console.log('View count incremented for song:', song.id);
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    incrementViewCount();
  }, [song.id]);

  // Auto-scroll functionality
  useAutoScroll({ 
    isActive: autoScroll.isActive, 
    speed: autoScroll.speed, 
    toggleAutoScroll: () => setAutoScroll(prev => ({ ...prev, isActive: !prev.isActive }))
  });

  // Metronome functionality
  useMetronome({
    bpm: manualBpm || song.bpm,
    isActive: metronomeActive,
    onToggle: () => setMetronomeActive(prev => !prev)
  });

  // Business logic handlers
  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      onDelete(song.id);
      router.push('/dashboard');
    }
  };

  const handleToggleAutoScroll = () => {
    setAutoScroll(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleToggleCapo = (value: boolean) => {
    setUseCapo(value);
  };

  // Navigation handlers
  const handleNextSong = () => {
    if (typeof window === 'undefined') return;
    
    const navigationDataStr = sessionStorage.getItem('songNavigation');
    if (!navigationDataStr) return;
    
    try {
      const navigationData = JSON.parse(navigationDataStr);
      const { songList, currentIndex } = navigationData;
      
      if (currentIndex < songList.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextSongId = songList[nextIndex];
        
        // Update current index in sessionStorage
        const updatedData = {
          ...navigationData,
          currentIndex: nextIndex
        };
        sessionStorage.setItem('songNavigation', JSON.stringify(updatedData));
        
        // Mark that Next has been used
        sessionStorage.setItem('hasUsedNext', 'true');
        setHasUsedNext(true);
        
        // Navigate to next song
        router.push(`/song/${nextSongId}`);
      }
    } catch (error) {
      console.error('Error parsing navigation data:', error);
    }
  };

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
    editContent,
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
    onEditContentChange: setEditContent,
    onSave: handleSave,
    onDelete: handleDelete,
    onChordClick: handleChordClick,
    onToggleAutoScroll: handleToggleAutoScroll,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
    onResetFontSize: resetFontSize,
    onResetScroll: resetScroll,
    onCancelEdit: handleCancelEdit,
    onToggleEdit: handleToggleEdit,
    onCloseChordDiagram: handleCloseChordDiagram,
    onSetSelectedInstrument: setSelectedInstrument,
    onSetTransposeValue: setTransposeValue,
    onSetAutoScrollSpeed: (speed: number) => setAutoScroll(prev => ({ ...prev, speed })),
    useCapo,
    onToggleCapo: handleToggleCapo,
    onNavigateBack: () => router.push('/dashboard'),
    onPrevSong: handlePrevSong,
    onNextSong: handleNextSong,
    canPrevSong: canPrevSong,
    canNextSong: canNextSong,
    isAuthenticated
  };

  return <SongViewer {...songViewerProps} />;
}

