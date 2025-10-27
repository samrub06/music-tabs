'use client';

import { useState } from 'react';
import { 
  MusicalNoteIcon, 
  PlayIcon, 
  PauseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { MedleyResult, MedleySong } from '@/lib/services/medleyService';
import { useApp } from '@/context/AppContext';

interface MedleyPlaylistProps {
  medley: MedleyResult;
  onSongSelect?: (song: MedleySong) => void;
}

export default function MedleyPlaylist({ medley, onSongSelect }: MedleyPlaylistProps) {
  const { createPlaylistFromMedleyUI } = useApp();
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentSongIndex < medley.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTransitionColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Votre Medley
          </h2>
          <p className="text-sm text-gray-600">
            {medley.songs.length} chansons • {Math.round(medley.estimatedDuration)} min
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            Score: <span className="font-medium text-purple-600">{Math.round(medley.totalScore * 100)}%</span>
          </div>
          <button
            onClick={async () => {
              const defaultName = `Medley ${new Date().toLocaleString('fr-FR')}`;
              const name = prompt('Nom de la playlist ?', defaultName) || defaultName;
              try {
                setIsSaving(true);
                await createPlaylistFromMedleyUI(name, medley.songs as any);
                alert('Playlist enregistrée');
              } catch (e) {
                alert('Erreur lors de la sauvegarde de la playlist');
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder en playlist'}
          </button>
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentSongIndex === 0}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={handlePlay}
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6" />
          )}
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentSongIndex === medley.songs.length - 1}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Current Song Info */}
      {medley.songs.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-purple-900">
              {medley.songs[currentSongIndex].title}
            </h3>
            <span className="text-sm text-purple-700">
              {currentSongIndex + 1} / {medley.songs.length}
            </span>
          </div>
          <p className="text-purple-700 mb-2">
            {medley.songs[currentSongIndex].author}
          </p>
          <div className="flex items-center space-x-4 text-sm">
            {medley.songs[currentSongIndex].key && (
              <div className="flex items-center">
                <KeyIcon className="h-4 w-4 mr-1" />
                <span>{medley.songs[currentSongIndex].key}</span>
              </div>
            )}
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              <span className={getScoreColor(medley.songs[currentSongIndex].compatibilityScore)}>
                Compatibilité: {Math.round(medley.songs[currentSongIndex].compatibilityScore * 100)}%
              </span>
            </div>
            {currentSongIndex > 0 && (
              <div className="flex items-center">
                <span className="text-gray-600">Transition:</span>
                <span className={`ml-1 ${getTransitionColor(medley.songs[currentSongIndex].transitionScore)}`}>
                  {Math.round(medley.songs[currentSongIndex].transitionScore * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {medley.songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => {
              setCurrentSongIndex(index);
              onSongSelect?.(song);
            }}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              index === currentSongIndex
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <MusicalNoteIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {song.title}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {song.author}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {song.key && (
                  <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {song.key}
                  </span>
                )}
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getScoreColor(song.compatibilityScore)}`}>
                  {Math.round(song.compatibilityScore * 100)}%
                </span>
                {index > 0 && (
                  <span className={`text-xs ${getTransitionColor(song.transitionScore)}`}>
                    T: {Math.round(song.transitionScore * 100)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                #{index + 1}
              </span>
              {index === currentSongIndex && isPlaying && (
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Key Progression */}
      {medley.keyProgression.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Progression des tonalités
          </h4>
          <div className="flex items-center space-x-2 text-sm">
            {medley.keyProgression.map((key, index) => (
              <div key={index} className="flex items-center">
                <span className="px-2 py-1 bg-white rounded border text-gray-700">
                  {key}
                </span>
                {index < medley.keyProgression.length - 1 && (
                  <span className="text-gray-400 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
