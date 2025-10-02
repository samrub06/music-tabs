'use client';

import SongViewer from '@/components/SongViewer';
import { useApp } from '@/context/AppContext';
import { songService } from '@/lib/services/songService';
import { Song } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SongPage() {
  const { songs } = useApp();
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSong = async () => {
      // First, try to find the song in the context
      const songFromContext = songs.find(s => s.id === songId);
      
      if (songFromContext) {
        setCurrentSong(songFromContext);
        setIsLoading(false);
        return;
      }

      // If not found in context (e.g., after refresh), load from API
      try {
        const songFromAPI = await songService.getSongById(songId);
        if (songFromAPI) {
          setCurrentSong(songFromAPI);
        } else {
          // Song doesn't exist, redirect to home
          console.log('Song not found, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading song:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [songId, songs, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la chanson...</p>
        </div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Chanson non trouvée</p>
        </div>
      </div>
    );
  }

  return <SongViewer song={currentSong} />;
}
