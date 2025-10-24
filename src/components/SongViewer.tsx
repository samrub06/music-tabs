'use client';

import { Song } from '@/types';
import React from 'react';
import SongViewerContainer from './containers/SongViewerContainer';

interface SongViewerProps {
  song: Song;
}

export default function SongViewer({ song }: SongViewerProps) {
  return <SongViewerContainer song={song} />;
}
