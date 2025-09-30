'use client';

import SongViewer from '@/components/SongViewer';
import { useApp } from '@/context/AppContext';
import { Song } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SongPage() {
  const { songs } = useApp();
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  useEffect(() => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      setCurrentSong(song);
    } else {
      // Song not found, redirect to home
      router.push('/');
    }
  }, [songId, songs, router]);

  if (!currentSong) {
    return <div>Chargement...</div>;
  }

  return <SongViewer song={currentSong} />;
}
