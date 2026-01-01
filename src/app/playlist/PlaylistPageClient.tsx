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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/playlists')}
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Retour aux playlists
          </button>
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Créer une playlist</h1>
          </div>
          <p className="text-gray-600">
            Générez une playlist parfaite en sélectionnant des dossiers ou des genres, et en choisissant une tonalité préférée. Toutes les chansons seront automatiquement transposées à cette tonalité.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Playlist Generator */}
          <div>
            <PlaylistGenerator 
              songs={songs} 
              folders={folders} 
              onPlaylistGenerated={handlePlaylistGenerated} 
            />
          </div>

          {/* Generated Playlist */}
          <div>
            {generatedPlaylist ? (
              <PlaylistView 
                playlist={generatedPlaylist} 
                onSongSelect={handleSongSelect}
                onCreatePlaylist={handleCreatePlaylist}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune playlist générée
                  </h3>
                  <p className="text-gray-500">
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

