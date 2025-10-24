import { Song } from '@/types';
import { NOTES, parseChord, normalizeNote } from '@/utils/chords';

export interface MedleyOptions {
  targetKey?: string;
  selectedFolders?: string[];
  selectedSongs?: string[];
  useRandomSelection?: boolean;
  maxSongs?: number;
}

export interface MedleySong extends Song {
  compatibilityScore: number;
  transitionScore: number;
  keyAdjustment?: number;
}

export interface MedleyResult {
  songs: MedleySong[];
  totalScore: number;
  keyProgression: string[];
  estimatedDuration: number;
}

// Calculate chord compatibility between two chords
export function calculateChordCompatibility(chord1: string, chord2: string): number {
  if (!chord1 || !chord2) return 0;
  
  const parsed1 = parseChord(chord1);
  const parsed2 = parseChord(chord2);
  
  if (!parsed1 || !parsed2) return 0;
  
  const root1 = normalizeNote(parsed1.root);
  const root2 = normalizeNote(parsed2.root);
  
  // Get semitone distances
  const index1 = NOTES.indexOf(root1);
  const index2 = NOTES.indexOf(root2);
  
  if (index1 === -1 || index2 === -1) return 0;
  
  const distance = Math.min(
    Math.abs(index2 - index1),
    12 - Math.abs(index2 - index1)
  );
  
  // Perfect compatibility for same chord
  if (distance === 0) return 1.0;
  
  // Strong compatibility for related chords
  if (distance === 1 || distance === 11) return 0.8; // Semitone
  if (distance === 2 || distance === 10) return 0.7; // Whole tone
  if (distance === 3 || distance === 9) return 0.6;  // Minor third
  if (distance === 4 || distance === 8) return 0.5; // Major third
  if (distance === 5 || distance === 7) return 0.4; // Perfect fourth/fifth
  if (distance === 6) return 0.3; // Tritone
  
  return 0.2; // Weak compatibility
}

// Calculate key compatibility
export function calculateKeyCompatibility(songKey: string, targetKey: string): number {
  if (!songKey || !targetKey) return 0.5; // Neutral if no key info
  
  const parsedSong = parseChord(songKey);
  const parsedTarget = parseChord(targetKey);
  
  if (!parsedSong || !parsedTarget) return 0.5;
  
  const songRoot = normalizeNote(parsedSong.root);
  const targetRoot = normalizeNote(parsedTarget.root);
  
  const index1 = NOTES.indexOf(songRoot);
  const index2 = NOTES.indexOf(targetRoot);
  
  if (index1 === -1 || index2 === -1) return 0.5;
  
  const distance = Math.min(
    Math.abs(index2 - index1),
    12 - Math.abs(index2 - index1)
  );
  
  // Perfect match
  if (distance === 0) return 1.0;
  
  // Related keys (circle of fifths)
  if (distance === 1 || distance === 11) return 0.9; // Relative major/minor
  if (distance === 5 || distance === 7) return 0.8; // Perfect fourth/fifth
  if (distance === 2 || distance === 10) return 0.7; // Whole tone
  if (distance === 3 || distance === 9) return 0.6;  // Minor third
  if (distance === 4 || distance === 8) return 0.5; // Major third
  if (distance === 6) return 0.3; // Tritone
  
  return 0.4; // Weak compatibility
}

// Calculate transition score between two songs
export function calculateTransitionScore(song1: Song, song2: Song): number {
  if (!song1.lastChord || !song2.firstChord) return 0.5;
  
  const chordCompatibility = calculateChordCompatibility(song1.lastChord, song2.firstChord);
  
  // Bonus for same key
  let keyBonus = 0;
  if (song1.key && song2.key) {
    const keyCompatibility = calculateKeyCompatibility(song1.key, song2.key);
    keyBonus = keyCompatibility * 0.3;
  }
  
  return Math.min(1.0, chordCompatibility + keyBonus);
}

// Generate optimal medley sequence
export function generateMedleySequence(
  songs: Song[], 
  options: MedleyOptions = {}
): MedleyResult {
  console.log('generateMedleySequence called with:', songs.length, 'songs');
  console.log('Options:', options);
  
  if (songs.length === 0) {
    console.log('No songs provided, returning empty result');
    return {
      songs: [],
      totalScore: 0,
      keyProgression: [],
      estimatedDuration: 0
    };
  }
  
  const { targetKey, maxSongs = 10 } = options;
  console.log('Processing with targetKey:', targetKey, 'maxSongs:', maxSongs);
  
  // Filter and score songs
  let candidateSongs = songs.map(song => {
    const compatibilityScore = targetKey 
      ? calculateKeyCompatibility(song.key || '', targetKey)
      : 0.5;
    
    return {
      ...song,
      compatibilityScore,
      transitionScore: 0,
      keyAdjustment: 0
    } as MedleySong;
  });
  
  console.log('Scored candidate songs:', candidateSongs.length);
  console.log('Sample scored songs:', candidateSongs.slice(0, 3).map(s => ({ 
    title: s.title, 
    key: s.key, 
    compatibilityScore: s.compatibilityScore 
  })));
  
  // Sort by compatibility score
  candidateSongs.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  
  // Limit to maxSongs
  candidateSongs = candidateSongs.slice(0, maxSongs);
  console.log('After limiting to maxSongs:', candidateSongs.length);
  
  // Generate optimal sequence using greedy algorithm
  const sequence: MedleySong[] = [];
  const used = new Set<string>();
  
  console.log('Starting sequence generation with', candidateSongs.length, 'candidates');
  
  // Start with the best song
  if (candidateSongs.length > 0) {
    sequence.push(candidateSongs[0]);
    used.add(candidateSongs[0].id);
    console.log('Added first song to sequence:', candidateSongs[0].title);
  }
  
  // Build sequence by finding best transitions
  while (sequence.length < candidateSongs.length) {
    const lastSong = sequence[sequence.length - 1];
    let bestNext: MedleySong | null = null;
    let bestScore = -1;
    
    console.log('Looking for next song after:', lastSong.title);
    
    for (const candidate of candidateSongs) {
      if (used.has(candidate.id)) continue;
      
      const transitionScore = calculateTransitionScore(lastSong, candidate);
      const totalScore = transitionScore * 0.7 + candidate.compatibilityScore * 0.3;
      
      console.log(`  Candidate ${candidate.title}: transition=${transitionScore}, total=${totalScore}`);
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestNext = { ...candidate, transitionScore };
      }
    }
    
    if (bestNext) {
      sequence.push(bestNext);
      used.add(bestNext.id);
      console.log('Added to sequence:', bestNext.title, 'with score:', bestScore);
    } else {
      console.log('No more good transitions found');
      break; // No more good transitions
    }
  }
  
  console.log('Final sequence length:', sequence.length);
  
  // Calculate total score
  const totalScore = sequence.reduce((sum, song, index) => {
    if (index === 0) return song.compatibilityScore;
    return sum + song.transitionScore;
  }, 0) / sequence.length;
  
  // Generate key progression
  const keyProgression = sequence.map(song => song.key || 'Unknown');
  
  // Estimate duration (assuming 3-4 minutes per song)
  const estimatedDuration = sequence.length * 3.5;
  
  return {
    songs: sequence,
    totalScore,
    keyProgression,
    estimatedDuration
  };
}

// Get songs from selected folders
export function getSongsFromFolders(
  allSongs: Song[], 
  folderIds: string[]
): Song[] {
  if (folderIds.length === 0) return allSongs;
  
  return allSongs.filter(song => 
    folderIds.includes(song.folderId || 'unorganized')
  );
}

// Get random selection of songs
export function getRandomSongs(songs: Song[], count: number): Song[] {
  const shuffled = [...songs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Calculate key adjustment needed for a song
export function calculateKeyAdjustment(songKey: string, targetKey: string): number {
  if (!songKey || !targetKey) return 0;
  
  const parsedSong = parseChord(songKey);
  const parsedTarget = parseChord(targetKey);
  
  if (!parsedSong || !parsedTarget) return 0;
  
  const songRoot = normalizeNote(parsedSong.root);
  const targetRoot = normalizeNote(parsedTarget.root);
  
  const index1 = NOTES.indexOf(songRoot);
  const index2 = NOTES.indexOf(targetRoot);
  
  if (index1 === -1 || index2 === -1) return 0;
  
  let adjustment = index2 - index1;
  if (adjustment > 6) adjustment -= 12;
  if (adjustment < -6) adjustment += 12;
  
  return adjustment;
}
