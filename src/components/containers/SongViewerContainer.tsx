'use client';

import { useApp } from '@/context/AppContext';
import { Song } from '@/types';
import { transposeStructuredSong, renderStructuredSong } from '@/utils/structuredSong';
import { useRouter } from 'next/navigation';
import React, { useRef, useEffect } from 'react';
import SongViewer from '../presentational/SongViewer';
import { useSongEditor } from '@/lib/hooks/useSongEditor';
import { useAutoScroll } from '@/lib/hooks/useAutoScroll';
import { useChordDiagram } from '@/lib/hooks/useChordDiagram';
import { useFontSize } from '@/lib/hooks/useFontSize';
import { songService } from '@/lib/services/songService';

interface SongViewerContainerProps {
  song: Song;
}

export default function SongViewerContainer({ song }: SongViewerContainerProps) {
  const {
    updateSong,
    deleteSong,
    selectedInstrument,
    setSelectedInstrument,
    transposeValue,
    setTransposeValue,
    autoScroll,
    toggleAutoScroll,
    setAutoScrollSpeed
  } = useApp();
  const router = useRouter();

  // Custom hooks
  const {
    isEditing,
    editContent,
    isSaving,
    setEditContent,
    handleSave,
    handleCancelEdit,
    handleToggleEdit
  } = useSongEditor({ song, updateSong });

  const { selectedChord, showChordDiagram, handleChordClick, handleCloseChordDiagram } = useChordDiagram();
  
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSize();
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Increment view count when component mounts
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await songService.incrementViewCount(song.id);
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
    toggleAutoScroll 
  });

  // Business logic handlers
  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(song.id);
      router.push('/');
    }
  };

  const handleToggleAutoScroll = () => {
    toggleAutoScroll();
  };

  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // Transpose song for display
  const transposedSong = transposeStructuredSong(song, transposeValue);
  const transposedContent = renderStructuredSong(transposedSong, {
    maxWidth: 80,
    wordWrap: true,
    isMobile: window.innerWidth < 768
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
    onSetAutoScrollSpeed: setAutoScrollSpeed,
    onNavigateBack: () => router.push('/')
  };

  return <SongViewer {...songViewerProps} />;
}
