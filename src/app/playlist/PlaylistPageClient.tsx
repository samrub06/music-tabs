'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import PlaylistGenerator from '@/components/PlaylistGenerator';
import PlaylistView from '@/components/PlaylistView';
import { PlaylistResult } from '@/lib/services/playlistGeneratorService';
import { Song, Folder } from '@/types';
import { createPlaylistFromGeneratedPlaylistAction } from '@/app/(protected)/dashboard/actions';

interface PlaylistPageClientProps {
  songs: Song[];
  folders: Folder[];
}

export default function PlaylistPageClient({ songs, folders }: PlaylistPageClientProps) {
  const router = useRouter();
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistResult | null>(null);

  const handlePlaylistGenerated = (result: PlaylistResult) => {
    setGeneratedPlaylist(result);
  };

  const handleSongSelect = (song: any) => {
    router.push(`/song/${song.id}`);
  };

  const handleCreatePlaylist = async (name: string, playlist: PlaylistResult) => {
    await createPlaylistFromGeneratedPlaylistAction(name, playlist);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <button
            onClick={() => router.push('/playlists')}
            className="mb-3 sm:mb-4 inline-flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors active:scale-95"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            Retour aux playlists
          </button>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Créer une playlist</h1>
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Générez une playlist parfaite en sélectionnant des dossiers ou des genres, et en choisissant une tonalité préférée. Toutes les chansons seront automatiquement transposées à cette tonalité.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Playlist Generator */}
          <div className="order-2 lg:order-1">
            <PlaylistGenerator 
              songs={songs} 
              folders={folders} 
              onPlaylistGenerated={handlePlaylistGenerated} 
            />
          </div>

          {/* Generated Playlist */}
          <div className="order-1 lg:order-2">
            {generatedPlaylist ? (
              <PlaylistView 
                playlist={generatedPlaylist} 
                onSongSelect={handleSongSelect}
                onCreatePlaylist={handleCreatePlaylist}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="text-center py-8 sm:py-12">
                  <SparklesIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune playlist générée
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">
                    Configurez vos préférences et générez votre première playlist
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

