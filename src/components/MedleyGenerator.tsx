'use client';

import { useState, useEffect } from 'react';
import { 
  MusicalNoteIcon, 
  SparklesIcon,
  FolderIcon,
  ClockIcon,
  KeyIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { MedleyResult, generateMedleySequence, getRandomSongs } from '@/lib/services/medleyService';
import { Song, Folder } from '@/types';

interface MedleyGeneratorProps {
  songs: Song[];
  folders: Folder[];
  onMedleyGenerated: (result: MedleyResult) => void;
}

export default function MedleyGenerator({ songs, folders, onMedleyGenerated }: MedleyGeneratorProps) {
  
  const [targetKey, setTargetKey] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [useRandomSelection, setUseRandomSelection] = useState(false);
  const [maxSongs, setMaxSongs] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedley, setGeneratedMedley] = useState<MedleyResult | null>(null);

  const availableKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

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

  const handleGenerateMedley = async () => {
    setIsGenerating(true);
    /* import { MedleyResult, MedleySong } from '@/lib/services/
medleyService';
    
    try {
      const response = await fetch('/api/medley/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetKey: targetKey || undefined,
          selectedFolders: selectedFolders.length > 0 ? 
          selectedFolders : undefined,
          selectedSongs: selectedSongs.length > 0 ? 
          selectedSongs : undefined,
          useRandomSelection,
          maxSongs
        }),
      if (!response.ok) {
        throw new Error('Failed to generate medley');
      }

      const result: MedleyResult = await response.json();
 */
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

      // Generate medley locally
      const result: MedleyResult = generateMedleySequence(candidateSongs, {
        targetKey: targetKey || undefined,
        selectedFolders: selectedFolders.length > 0 ? selectedFolders : undefined,
        selectedSongs: selectedSongs.length > 0 ? selectedSongs : undefined,
        useRandomSelection,
        maxSongs
      });

      setGeneratedMedley(result);
      onMedleyGenerated(result);
    } catch (error) {
      console.error('Error generating medley:', error);
      alert('Erreur lors de la génération du medley');
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
    
    return filtered;
  };

  const filteredSongs = getFilteredSongs();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">
          Générateur de Medley
        </h2>
      </div>

      <div className="space-y-6">
        {/* Target Key Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <KeyIcon className="h-4 w-4 inline mr-1" />
            Tonalité cible (optionnel)
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
        </div>

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
          onClick={handleGenerateMedley}
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
              Générer le medley
            </>
          )}
        </button>
      </div>

      {/* Generated Medley Preview */}
      {generatedMedley && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Medley généré
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Chansons:</span> {generatedMedley.songs.length}
            </div>
            <div>
              <span className="font-medium">Score:</span> {Math.round(generatedMedley.totalScore * 100)}%
            </div>
            <div>
              <span className="font-medium">Durée estimée:</span> {Math.round(generatedMedley.estimatedDuration)} min
            </div>
            <div>
              <span className="font-medium">Tonalités:</span> {generatedMedley.keyProgression.join(' → ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
