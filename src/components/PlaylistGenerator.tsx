'use client';

import { useState, useMemo } from 'react';
import { 
  MusicalNoteIcon, 
  SparklesIcon,
  FolderIcon,
  ClockIcon,
  KeyIcon,
  ArrowPathIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { PlaylistResult, generatePlaylistSequence, getRandomSongs } from '@/lib/services/playlistGeneratorService';
import { Song, Folder } from '@/types';

interface PlaylistGeneratorProps {
  songs: Song[];
  folders: Folder[];
  onPlaylistGenerated: (result: PlaylistResult) => void;
}

export default function PlaylistGenerator({ songs, folders, onPlaylistGenerated }: PlaylistGeneratorProps) {
  
  const [targetKey, setTargetKey] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [useRandomSelection, setUseRandomSelection] = useState(false);
  const [maxSongs, setMaxSongs] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistResult | null>(null);

  const availableKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

  // Extract unique genres from songs
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    songs.forEach(song => {
      if (song.genre) {
        genreSet.add(song.genre);
      }
    });
    return Array.from(genreSet).sort();
  }, [songs]);

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => {
      const isSelected = prev.includes(folderId);
      if (isSelected) {
        return prev.filter(id => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  };

  const handleSongToggle = (songId: string) => {
    setSelectedSongs(prev => {
      const isSelected = prev.includes(songId);
      if (isSelected) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const handleGeneratePlaylist = async () => {
    setIsGenerating(true);
    try {
      // Start from all songs in context
      let candidateSongs = [...songs];

      // Filter by folders if specified (including 'unorganized')
      if (selectedFolders.length > 0) {
        candidateSongs = candidateSongs.filter(s =>
          selectedFolders.includes(s.folderId || 'unorganized')
        );
      }

      // Filter by specific song IDs if specified
      if (selectedSongs.length > 0) {
        const selectedSet = new Set(selectedSongs);
        candidateSongs = candidateSongs.filter(s => selectedSet.has(s.id));
      }

      // Random selection if requested
      if (useRandomSelection) {
        candidateSongs = getRandomSongs(candidateSongs, maxSongs);
      }

      // Generate playlist locally
      const result: PlaylistResult = generatePlaylistSequence(candidateSongs, {
        targetKey: targetKey || undefined,
        selectedFolders: selectedFolders.length > 0 ? selectedFolders : undefined,
        selectedSongs: selectedSongs.length > 0 ? selectedSongs : undefined,
        genre: selectedGenre || undefined,
        useRandomSelection,
        maxSongs
      });

      setGeneratedPlaylist(result);
      onPlaylistGenerated(result);
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Erreur lors de la génération de la playlist');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredSongs = () => {
    let filtered = songs;
    
    if (selectedFolders.length > 0) {
      filtered = filtered.filter(song => 
        selectedFolders.includes(song.folderId || 'unorganized')
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(song => song.genre === selectedGenre);
    }
    
    return filtered;
  };

  const filteredSongs = getFilteredSongs();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">
          Générateur de Playlist
        </h2>
      </div>

      <div className="space-y-6">
        {/* Target Key Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <KeyIcon className="h-4 w-4 inline mr-1" />
            Tonalité préférée (optionnel)
          </label>
          <select
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Aucune tonalité spécifique</option>
            {availableKeys.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Toutes les chansons seront automatiquement transposées à cette tonalité
          </p>
        </div>

        {/* Genre Selection */}
        {availableGenres.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Genre (optionnel)
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Tous les genres</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Folder Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FolderIcon className="h-4 w-4 inline mr-1" />
            Dossiers à inclure
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFolders.includes('unorganized')}
                onChange={() => handleFolderToggle('unorganized')}
                className="mr-2"
              />
              <span className="text-sm">Chansons non organisées ({songs.filter(s => !s.folderId).length})</span>
            </label>
            {folders.map(folder => (
              <label key={folder.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFolders.includes(folder.id)}
                  onChange={() => handleFolderToggle(folder.id)}
                  className="mr-2"
                />
                <span className="text-sm">{folder.name} ({songs.filter(s => s.folderId === folder.id).length})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Song Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MusicalNoteIcon className="h-4 w-4 inline mr-1" />
            Chansons spécifiques (optionnel)
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
            {filteredSongs.slice(0, 20).map(song => (
              <label key={song.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSongs.includes(song.id)}
                  onChange={() => handleSongToggle(song.id)}
                  className="mr-2"
                />
                <span className="text-sm truncate">
                  {song.title} - {song.author}
                  {song.key && <span className="text-purple-600 ml-1">({song.key})</span>}
                </span>
              </label>
            ))}
            {filteredSongs.length > 20 && (
              <p className="text-xs text-gray-500">
                ... et {filteredSongs.length - 20} autres chansons
              </p>
            )}
          </div>
        </div>

        {/* Random Selection */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useRandomSelection}
              onChange={(e) => setUseRandomSelection(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Sélection aléatoire
            </span>
          </label>
        </div>

        {/* Max Songs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="h-4 w-4 inline mr-1" />
            Nombre maximum de chansons
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={maxSongs}
            onChange={(e) => setMaxSongs(parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGeneratePlaylist}
          disabled={isGenerating}
          className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5 mr-2" />
              Générer la playlist
            </>
          )}
        </button>
      </div>

      {/* Generated Playlist Preview */}
      {generatedPlaylist && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Playlist générée
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Chansons:</span> {generatedPlaylist.songs.length}
            </div>
            <div>
              <span className="font-medium">Score:</span> {Math.round(generatedPlaylist.totalScore * 100)}%
            </div>
            <div>
              <span className="font-medium">Durée estimée:</span> {Math.round(generatedPlaylist.estimatedDuration)} min
            </div>
            <div>
              <span className="font-medium">Tonalité:</span> {generatedPlaylist.keyProgression[0] || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

