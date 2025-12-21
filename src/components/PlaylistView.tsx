'use client';

import { useRouter } from 'next/navigation';
import { 
  MusicalNoteIcon, 
  PlayIcon,
  ChartBarIcon,
  KeyIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { PlaylistResult, PlaylistSong } from '@/lib/services/playlistGeneratorService';

interface PlaylistViewProps {
  playlist: PlaylistResult;
  onSongSelect?: (song: PlaylistSong) => void;
  onCreatePlaylist?: (name: string, playlist: PlaylistResult) => Promise<void>;
}

export default function PlaylistView({ playlist, onSongSelect, onCreatePlaylist }: PlaylistViewProps) {
  const router = useRouter();

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

  const formatKeyAdjustment = (adjustment: number): string => {
    if (adjustment === 0) return '';
    if (adjustment > 0) return `+${adjustment}`;
    return `${adjustment}`;
  };

  const handleStartPlaylist = () => {
    if (playlist.songs.length === 0) return;

    // Save playlist context to sessionStorage
    if (typeof window !== 'undefined') {
      const songList = playlist.songs.map(s => s.id);
      const playlistContext = {
        isPlaylist: true,
        targetKey: playlist.keyProgression[0] || '',
        songs: playlist.songs.map(s => ({
          id: s.id,
          keyAdjustment: s.keyAdjustment,
          originalKey: s.originalKey,
          targetKey: s.targetKey
        }))
      };

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: '/playlist',
        playlistContext
      };

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData));
      sessionStorage.removeItem('hasUsedNext'); // Reset navigation state

      // Navigate to first song
      router.push(`/song/${playlist.songs[0].id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Votre Playlist
          </h2>
          <p className="text-sm text-gray-600">
            {playlist.songs.length} chansons • {Math.round(playlist.estimatedDuration)} min
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            Score: <span className="font-medium text-purple-600">{Math.round(playlist.totalScore * 100)}%</span>
          </div>
          {onCreatePlaylist && (
            <button
              onClick={async () => {
                if (!onCreatePlaylist) return;
                const defaultName = `Playlist ${new Date().toLocaleString('fr-FR')}`;
                const name = prompt('Nom de la playlist ?', defaultName) || defaultName;
                try {
                  await onCreatePlaylist(name, playlist);
                  alert('Playlist enregistrée');
                } catch (e) {
                  alert('Erreur lors de la sauvegarde de la playlist');
                }
              }}
              className="px-3 py-2 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-700"
            >
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Start Playlist Button */}
      {playlist.songs.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleStartPlaylist}
            className="w-full flex items-center justify-center px-6 py-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            <PlayIcon className="h-6 w-6 mr-3" />
            Démarrer la playlist
          </button>
          <p className="mt-2 text-xs text-center text-gray-500">
            Cliquez pour commencer à jouer la première chanson. Utilisez le bouton "Suivante" pour naviguer entre les chansons.
          </p>
        </div>
      )}

      {/* Playlist Info */}
      {playlist.keyProgression.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <KeyIcon className="h-4 w-4 mr-1 text-purple-600" />
              <span className="font-medium text-purple-900">Tonalité de la playlist:</span>
              <span className="ml-2 px-2 py-1 bg-white rounded border border-purple-200 text-purple-700 font-semibold">
                {playlist.keyProgression[0]}
              </span>
            </div>
            <div className="text-purple-700">
              Toutes les chansons sont transposées à cette tonalité
            </div>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {playlist.songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => onSongSelect?.(song)}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
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
              <div className="flex items-center space-x-2 mt-1 flex-wrap">
                {/* Original Key */}
                {song.originalKey && song.originalKey !== 'Unknown' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    <KeyIcon className="h-3 w-3 mr-1" />
                    Original: {song.originalKey}
                  </span>
                )}
                
                {/* Key Adjustment */}
                {song.keyAdjustment !== 0 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    <ArrowRightIcon className="h-3 w-3 mr-1" />
                    {formatKeyAdjustment(song.keyAdjustment)} semitones
                  </span>
                )}
                
                {/* Target Key */}
                {song.targetKey && song.targetKey !== 'Unknown' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    <KeyIcon className="h-3 w-3 mr-1" />
                    → {song.targetKey}
                  </span>
                )}
                
                {/* Compatibility Score */}
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getScoreColor(song.compatibilityScore)}`}>
                  Compatibilité: {Math.round(song.compatibilityScore * 100)}%
                </span>
                
                {/* Transition Score */}
                {index > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getTransitionColor(song.transitionScore)} bg-opacity-20`}>
                    Transition: {Math.round(song.transitionScore * 100)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <span className="text-xs text-gray-500 font-medium">
                #{index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {playlist.songs.length === 0 && (
        <div className="text-center py-12">
          <MusicalNoteIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune chanson dans la playlist</p>
        </div>
      )}
    </div>
  );
}

