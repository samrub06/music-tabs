import { Song } from '@/types';
import { NOTES, parseChord, normalizeNote } from '@/utils/chords';

export interface PlaylistOptions {
  targetKey?: string;
  selectedFolders?: string[];
  selectedSongs?: string[];
  genre?: string; // Filtrage par genre
  useRandomSelection?: boolean;
  maxSongs?: number;
}

export interface PlaylistSong extends Song {
  compatibilityScore: number;
  transitionScore: number;
  keyAdjustment: number; // Semitones de transposition
  originalKey: string;   // Tonalité originale
  targetKey: string;     // Tonalité cible (après transposition)
}

export interface PlaylistResult {
  songs: PlaylistSong[];
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

// Normalize key to standard format
function normalizeKey(k: string): string {
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  const upper = k.replace(/\s+/g, '').replace('major', '').replace('Minor', 'm').replace('minor', 'm');
  // Extract base like C, C#, Db and optional m
  const match = upper.match(/^([A-G](?:#|b)?)(m)?$/i);
  if (!match) return k.trim();
  let base = match[1].toUpperCase();
  const isMinor = !!match[2];
  if (flatToSharp[base]) base = flatToSharp[base];
  return base + (isMinor ? 'm' : '');
}

// Extract key from song title (e.g., "Song Title (C)")
function extractKeyFromTitle(title?: string): string | null {
  if (!title) return null;
  // Look for tokens in parentheses e.g. (C), (Am), (Db), (G#m)
  const parenMatches = title.match(/\(([^)]+)\)/g) || [];
  for (const m of parenMatches) {
    const token = m.replace(/[()]/g, '').trim();
    const n = normalizeKey(token);
    if (/^[A-G](?:#)?m?$/.test(n)) return n; // Accept A..G with optional # and optional m
  }
  return null;
}

// Get song key from various sources
function getSongKey(s: Song): string {
  const fromField = (s.key || '').trim();
  if (fromField) return normalizeKey(fromField);
  const fromTitle = extractKeyFromTitle(s.title);
  if (fromTitle) return normalizeKey(fromTitle);
  return 'Unknown';
}

// Calculate key adjustment needed for a song
export function calculateKeyAdjustment(songKey: string, targetKey: string): number {
  if (!songKey || !targetKey || songKey === 'Unknown' || targetKey === 'Unknown') return 0;
  
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

// Generate optimal playlist sequence with automatic transposition
export function generatePlaylistSequence(
  songs: Song[], 
  options: PlaylistOptions = {}
): PlaylistResult {
  if (songs.length === 0) {
    return { songs: [], totalScore: 0, keyProgression: [], estimatedDuration: 0 };
  }

  // Filter by genre if specified
  let candidateSongs = [...songs];
  if (options.genre) {
    candidateSongs = candidateSongs.filter(s => s.genre === options.genre);
  }

  // Determine target key:
  // - if options.targetKey provided: use it
  // - else: most common key among candidate songs
  const requestedKey = (options.targetKey || '').trim();
  let targetKey = requestedKey ? normalizeKey(requestedKey) : '';
  
  if (!targetKey) {
    const counts = new Map<string, number>();
    for (const s of candidateSongs) {
      const k = getSongKey(s);
      if (k !== 'Unknown') {
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }
    targetKey = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'C';
  }

  // For each song, calculate key adjustment and create PlaylistSong
  const sequence: PlaylistSong[] = candidateSongs.map(s => {
    const originalKey = getSongKey(s);
    const keyAdjustment = calculateKeyAdjustment(originalKey, targetKey);
    
    // Calculate compatibility score (how well it fits the target key)
    const compatibilityScore = originalKey === 'Unknown' 
      ? 0.5 
      : calculateKeyCompatibility(originalKey, targetKey);
    
    // Calculate transition score (will be updated when we have previous song)
    const transitionScore = 1.0; // Default, will be calculated in sequence
    
    return {
      ...s,
      compatibilityScore,
      transitionScore,
      keyAdjustment,
      originalKey,
      targetKey
    };
  });

  // Calculate transition scores between consecutive songs
  for (let i = 1; i < sequence.length; i++) {
    const prevSong = sequence[i - 1];
    const currentSong = sequence[i];
    
    // Use the target key for transition calculation since all songs are transposed
    const transitionScore = calculateTransitionScore(
      { ...prevSong, key: prevSong.targetKey },
      { ...currentSong, key: currentSong.targetKey }
    );
    
    sequence[i].transitionScore = transitionScore;
  }

  // Calculate total score
  const totalScore = sequence.length > 0
    ? sequence.reduce((sum, s) => sum + s.compatibilityScore + s.transitionScore, 0) / (sequence.length * 2)
    : 0;

  return {
    songs: sequence,
    totalScore: Math.min(1.0, totalScore),
    keyProgression: sequence.map(s => s.targetKey),
    estimatedDuration: sequence.length * 3.5
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

