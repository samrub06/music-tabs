'use client';

import React, { useState, useEffect } from 'react';
import { Song } from '@/types';
import { MusicalNoteIcon, PlayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useApp } from '@/context/AppContext';
import { calculateSongTransitionScore } from '@/utils/chordAnalysis';
import { chordAnalysisService } from '@/lib/services/chordAnalysisService';

interface PlaylistSong extends Song {
  selected: boolean;
  soundingKey?: string;
}

export default function PlaylistGeneratorPage() {
  const { songs } = useApp();
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistSong[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingChords, setIsAnalyzingChords] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string>('');
  const [playlistLength, setPlaylistLength] = useState(10);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize playlist songs with soundingKey calculation when songs change
  useEffect(() => {
    const songsWithSoundingKey = songs.map(song => ({
      ...song,
      selected: false,
      soundingKey: calculateSoundingKey(song.key, song.capo)
    }));
    setPlaylistSongs(songsWithSoundingKey);
  }, [songs]);

  // Calculate sounding key based on key + capo
  const calculateSoundingKey = (key?: string, capo?: number): string => {
    if (!key) return '';
    
    const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const minor = /m$/.test(key);
    const root = key.replace(/m$/, '');
    const capoSemitones = capo || 0;
    
    const rootIndex = notes.indexOf(root);
    if (rootIndex === -1) return key;
    
    const newIndex = (rootIndex + capoSemitones) % 12;
    const newRoot = notes[newIndex];
    
    return newRoot + (minor ? 'm' : '');
  };

  // Toggle song selection
  const toggleSongSelection = (songId: string) => {
    setPlaylistSongs(prev => 
      prev.map(song => 
        song.id === songId 
          ? { ...song, selected: !song.selected }
          : song
      )
    );
  };

  // Select all songs
  const selectAllSongs = () => {
    setPlaylistSongs(prev => 
      prev.map(song => ({ ...song, selected: true }))
    );
  };

  // Clear all selections
  const clearAllSelections = () => {
    setPlaylistSongs(prev =>
      prev.map(song => ({ ...song, selected: false }))
    );
  };

  // Analyze chords for all selected songs
  const analyzeSelectedChords = async () => {
    const selectedSongs = playlistSongs.filter(song => song.selected);
    
    if (selectedSongs.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une chanson.' });
      return;
    }

    setIsAnalyzingChords(true);
    setMessage({ type: 'info', text: `Analyse des accords pour ${selectedSongs.length} chanson(s)...` });

    try {
      let analyzed = 0;
      for (const song of selectedSongs) {
        try {
          console.log('Analyzing song:', song.title, 'with sections:', song.sections?.length || 0);
          const chordAnalysis = chordAnalysisService.analyzeSongChordsFromObject(song);
          console.log('Chord analysis result:', chordAnalysis);
          
          setPlaylistSongs(prev => prev.map(s => 
            s.id === song.id 
              ? { ...s, firstChord: chordAnalysis.firstChord, lastChord: chordAnalysis.lastChord, chordProgression: chordAnalysis.chordProgression }
              : s
          ));
          analyzed++;
        } catch (error) {
          console.warn(`Failed to analyze chords for song ${song.id}:`, error);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `Accords analysés pour ${analyzed} chanson(s) !` 
      });
    } catch (error) {
      console.error('Error analyzing chords:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors de l\'analyse des accords.' 
      });
    } finally {
      setIsAnalyzingChords(false);
    }
  };

  // Generate playlist using the algorithm
  const generatePlaylist = async () => {
    const selectedSongs = playlistSongs.filter(song => song.selected);
    
    if (selectedSongs.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une chanson.' });
      return;
    }

    setIsGenerating(true);
    setIsAnalyzingChords(true);
    setMessage(null);

    try {
      // First, analyze chords for songs that don't have chord information
      const songsNeedingAnalysis = selectedSongs.filter(song => !song.firstChord || !song.lastChord);
      
      if (songsNeedingAnalysis.length > 0) {
        setMessage({ 
          type: 'info', 
          text: `Analyse des accords pour ${songsNeedingAnalysis.length} chanson(s)...` 
        });
        
        // Analyze chords for each song that needs it
        for (const song of songsNeedingAnalysis) {
          try {
            const chordAnalysis = chordAnalysisService.analyzeSongChordsFromObject(song);
            // Update the song in our local state
            setPlaylistSongs(prev => prev.map(s => 
              s.id === song.id 
                ? { ...s, firstChord: chordAnalysis.firstChord, lastChord: chordAnalysis.lastChord, chordProgression: chordAnalysis.chordProgression }
                : s
            ));
          } catch (error) {
            console.warn(`Failed to analyze chords for song ${song.id}:`, error);
          }
        }
      }

      // Calculate sounding keys for all selected songs
      const songsWithSoundingKey = selectedSongs.map(song => ({
        ...song,
        soundingKey: calculateSoundingKey(song.key, song.capo)
      }));

      // Generate playlist using the algorithm
      const generated = generatePlaylistSequence(songsWithSoundingKey, playlistLength, selectedSeed);
      setGeneratedPlaylist(generated);
      
      setMessage({ 
        type: 'success', 
        text: `Medley généré avec ${generated.length} chansons !` 
      });
    } catch (error) {
      console.error('Error generating playlist:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors de la génération du medley.' 
      });
    } finally {
      setIsGenerating(false);
      setIsAnalyzingChords(false);
    }
  };

  // Playlist generation algorithm - Improved for better musical flow
  const generatePlaylistSequence = (songs: PlaylistSong[], length: number, seedId?: string): PlaylistSong[] => {
    const used = new Set<string>();
    
    // Choose starting song intelligently
    let start: PlaylistSong;
    if (seedId) {
      start = songs.find(s => s.id === seedId) || songs[0];
    } else {
      // Find the most common key or the song with the most analyzed chords
      const songsWithChords = songs.filter(s => s.firstChord && s.lastChord);
      if (songsWithChords.length > 0) {
        // Group by sounding key and pick the largest group
        const keyGroups = songsWithChords.reduce((acc, song) => {
          const key = song.soundingKey || song.key || 'unknown';
          if (!acc[key]) acc[key] = [];
          acc[key].push(song);
          return acc;
        }, {} as Record<string, PlaylistSong[]>);
        
        const largestGroup = Object.values(keyGroups).reduce((max, group) => 
          group.length > max.length ? group : max, []);
        start = largestGroup[0];
      } else {
        start = songs[0];
      }
    }

    const result = [start];
    used.add(start.id);

    while (result.length < Math.min(length, songs.length)) {
      const last = result[result.length - 1];
      const next = findBestNextSong(songs, last, used);
      
      if (!next) {
        // If no good transition found, try to find a "bridge" song
        const bridgeSong = findBridgeSong(songs, last, used);
        if (bridgeSong) {
          result.push(bridgeSong);
          used.add(bridgeSong.id);
        } else {
          break;
        }
      } else {
        result.push(next);
        used.add(next.id);
      }
    }

    return result;
  };

  // Find the best next song based on scoring
  const findBestNextSong = (songs: PlaylistSong[], current: PlaylistSong, used: Set<string>): PlaylistSong | null => {
    const availableSongs = songs.filter(song => !used.has(song.id));
    
    if (availableSongs.length === 0) return null;

    const scoredSongs = availableSongs.map(song => ({
      song,
      score: calculateTransitionScore(current, song)
    }));

    scoredSongs.sort((a, b) => b.score - a.score);
    
    // Return the best song if score > 2, otherwise return null to try bridge
    return scoredSongs[0].score > 2 ? scoredSongs[0].song : null;
  };

  // Find a bridge song when no good transition is available
  const findBridgeSong = (songs: PlaylistSong[], current: PlaylistSong, used: Set<string>): PlaylistSong | null => {
    const availableSongs = songs.filter(song => !used.has(song.id));
    
    if (availableSongs.length === 0) return null;

    // Look for songs that can serve as bridges (moderate scores)
    const scoredSongs = availableSongs.map(song => ({
      song,
      score: calculateTransitionScore(current, song)
    }));

    scoredSongs.sort((a, b) => b.score - a.score);
    
    // Return the best available song even with low score
    return scoredSongs[0].song;
  };

  // Calculate transition score between two songs using chord analysis
  const calculateTransitionScore = (song1: PlaylistSong, song2: PlaylistSong): number => {
    let score = 0;
    
    // Use chord-based scoring if available
    if (song1.lastChord && song2.firstChord) {
      const chordAnalysis1 = {
        firstChord: song1.firstChord,
        lastChord: song1.lastChord,
        chordProgression: song1.chordProgression,
        key: song1.key,
        capo: song1.capo
      };
      
      const chordAnalysis2 = {
        firstChord: song2.firstChord,
        lastChord: song2.lastChord,
        chordProgression: song2.chordProgression,
        key: song2.key,
        capo: song2.capo
      };
      
      score += calculateSongTransitionScore(chordAnalysis1, chordAnalysis2);
    }
    
    // Fallback to key-based scoring
    if (song1.soundingKey && song2.soundingKey) {
      const keyScore = calculateKeyTransitionScore(song1.soundingKey, song2.soundingKey);
      score += keyScore;
    }
    
    return score;
  };

  // Calculate key transition score (fallback)
  const calculateKeyTransitionScore = (keyA: string, keyB: string): number => {
    if (!keyA || !keyB) return 0;
    if (keyA === keyB) return 3;
    if (isRelativeKey(keyA, keyB)) return 2;
    
    const distance = getFifthDistance(keyA, keyB);
    if (distance === 1) return 2;
    if (distance === 2) return 1;
    
    return 0;
  };

  // Check if two keys are relative (major/minor)
  const isRelativeKey = (keyA: string, keyB: string): boolean => {
    const relatives: { [key: string]: string } = {
      'C': 'Am', 'G': 'Em', 'D': 'Bm', 'A': 'F#m', 'E': 'C#m', 'B': 'G#m',
      'F#': 'D#m', 'F': 'Dm', 'Bb': 'Gm', 'Eb': 'Cm', 'Ab': 'Fm', 'Db': 'Bbm'
    };
    
    const normalize = (key: string) => key.replace(/m$/, '');
    const keyARoot = normalize(keyA);
    const keyBRoot = normalize(keyB);
    
    return relatives[keyARoot] === keyB || relatives[keyBRoot] === keyA;
  };

  // Get distance on circle of fifths
  const getFifthDistance = (keyA: string, keyB: string): number => {
    const fifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
    const normalize = (key: string) => key.replace(/m$/, '');
    
    const indexA = fifths.indexOf(normalize(keyA));
    const indexB = fifths.indexOf(normalize(keyB));
    
    if (indexA === -1 || indexB === -1) return 3;
    
    const distance = Math.min((12 + indexA - indexB) % 12, (12 + indexB - indexA) % 12);
    return distance;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Générateur de Medley
          </h1>
          <p className="text-gray-600">
            Sélectionnez une ou plusieurs chansons de départ, puis générez un medley qui s&apos;enchaîne parfaitement.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Song Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Chansons de départ pour le medley
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllSongs}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Tout désélectionner
                  </button>
                  <button
                    onClick={analyzeSelectedChords}
                    disabled={isAnalyzingChords || playlistSongs.filter(s => s.selected).length === 0}
                    className="text-sm text-orange-600 hover:text-orange-800 disabled:text-gray-400"
                  >
                    {isAnalyzingChords ? 'Analyse...' : 'Analyser accords'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Choisissez les chansons qui serviront de base pour générer votre medley
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {playlistSongs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <MusicalNoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune chanson trouvée</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Ajoutez des chansons à votre bibliothèque pour commencer
                    </p>
                  </div>
                </div>
              ) : (
                playlistSongs.map((song) => (
                <div
                  key={song.id}
                  className={`px-6 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    song.selected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleSongSelection(song.id)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={song.selected}
                      onChange={() => toggleSongSelection(song.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <MusicalNoteIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {song.author}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {song.key && (
                          <span className="text-xs text-blue-600 font-medium">
                            Key: {song.key}
                          </span>
                        )}
                        {song.capo && (
                          <span className="text-xs text-green-600 font-medium">
                            Capo: {song.capo}
                          </span>
                        )}
                        {song.soundingKey && (
                          <span className="text-xs text-purple-600 font-medium">
                            Sounds: {song.soundingKey}
                          </span>
                        )}
                        {song.firstChord && song.lastChord ? (
                          <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded">
                            {song.firstChord} → {song.lastChord}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Accords non analysés
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Medley Generation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Générer le medley
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Configurez les paramètres et générez votre medley personnalisé
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Seed Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chanson de départ (optionnel)
                </label>
                <select
                  value={selectedSeed}
                  onChange={(e) => setSelectedSeed(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir automatiquement</option>
                  {playlistSongs.filter(s => s.selected).map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.author}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si non sélectionnée, le medley commencera par la tonalité la plus fréquente
                </p>
              </div>

              {/* Medley Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur du medley
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={playlistLength}
                  onChange={(e) => setPlaylistLength(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le medley sera généré avec le nombre de chansons sélectionné
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePlaylist}
                disabled={isGenerating || playlistSongs.filter(s => s.selected).length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {isAnalyzingChords ? 'Analyse des accords...' : 'Génération du medley...'}
                    </span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    <span>Générer le medley</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Medley */}
        {generatedPlaylist.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Medley généré ({generatedPlaylist.length} chansons)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Votre medley personnalisé, optimisé pour un enchaînement fluide
              </p>
              <div className="mt-2 text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-green-100 text-green-700 rounded px-1 mr-1">Excellent</span>
                    Score 7+ (cadences parfaites, même accord)
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-100 text-yellow-700 rounded px-1 mr-1">Bon</span>
                    Score 5-6 (relatifs, quintes)
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-red-100 text-red-700 rounded px-1 mr-1">Transition</span>
                    Score 3-4 (tierces, secondes)
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {generatedPlaylist.map((song, index) => (
                <div key={song.id} className="px-6 py-4 flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <MusicalNoteIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {song.author}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {song.soundingKey && (
                      <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">
                        {song.soundingKey}
                      </span>
                    )}
                    {index > 0 && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        calculateTransitionScore(generatedPlaylist[index - 1], song) >= 7 
                          ? 'text-green-700 bg-green-100' 
                          : calculateTransitionScore(generatedPlaylist[index - 1], song) >= 5
                          ? 'text-yellow-700 bg-yellow-100'
                          : 'text-red-700 bg-red-100'
                      }`}>
                        {calculateTransitionScore(generatedPlaylist[index - 1], song) >= 7 
                          ? 'Excellent' 
                          : calculateTransitionScore(generatedPlaylist[index - 1], song) >= 5
                          ? 'Bon'
                          : 'Transition'
                        } ({calculateTransitionScore(generatedPlaylist[index - 1], song)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
