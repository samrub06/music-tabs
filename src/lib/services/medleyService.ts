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
  if (songs.length === 0) {
    return { songs: [], totalScore: 0, keyProgression: [], estimatedDuration: 0 };
  }

  // Determine grouping key:
  // - if options.targetKey provided: use it
  // - else: most common key among songs
  const requestedKey = (options.targetKey || '').trim();
  const normalizeKey = (k: string) => {
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
  };

  const extractKeyFromTitle = (title?: string): string | null => {
    if (!title) return null;
    // Look for tokens in parentheses e.g. (C), (Am), (Db), (G#m)
    const parenMatches = title.match(/\(([^)]+)\)/g) || [];
    for (const m of parenMatches) {
      const token = m.replace(/[()]/g, '').trim();
      const n = normalizeKey(token);
      if (/^[A-G](?:#)?m?$/.test(n)) return n; // Accept A..G with optional # and optional m
    }
    return null;
  };

  const getSongKey = (s: Song): string => {
    const fromField = (s.key || '').trim();
    if (fromField) return normalizeKey(fromField);
    const fromTitle = extractKeyFromTitle(s.title);
    if (fromTitle) return normalizeKey(fromTitle);
    return 'Unknown';
  };

  let groupingKey = requestedKey ? normalizeKey(requestedKey) : '';
  if (!groupingKey) {
    const counts = new Map<string, number>();
    for (const s of songs) {
      const k = getSongKey(s);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    groupingKey = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  }

  // Keep only songs matching the grouping key
  const grouped = songs.filter(s => getSongKey(s) === groupingKey);

  // Map to MedleySong with simple scores
  const sequence: MedleySong[] = grouped.map(s => ({
    ...s,
    compatibilityScore: 1,
    transitionScore: 1,
    keyAdjustment: 0
  }));

  return {
    songs: sequence,
    totalScore: sequence.length > 0 ? 1 : 0,
    keyProgression: sequence.map(s => getSongKey(s)),
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
