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
    onPrevSong: () => {}, // Remove navigation for now
    onNextSong: () => {}, // Remove navigation for now
    canPrevSong: false,
    canNextSong: false,
    isAuthenticated
  };

  return <SongViewer {...songViewerProps} />;
}

