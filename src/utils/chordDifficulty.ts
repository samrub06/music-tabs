/**
 * Utility functions for determining chord difficulty
 * Used to filter songs for beginners
 */

import { transposeChord } from '@/utils/chords';

// List of easy chords for beginners (no barre chords, no sharps/flats)
const EASY_CHORDS = new Set([
  // Major chords
  'C', 'D', 'E', 'G', 'A',
  // Minor chords
  'Am', 'Dm', 'Em',
  // 7th chords
  'C7', 'D7', 'E7', 'G7', 'A7', 'Am7', 'Dm7', 'Em7',
  // Major 7th
  'Cmaj7',
  // Suspended chords
  'Gsus4', 'Asus4', 'Dsus4',
  // Add9 (simple variations)
  'Cadd9'
]);

/**
 * Normalize chord name for comparison
 * Converts enharmonic equivalents (C# = Db, F# = Gb, etc.)
 */
function normalizeChord(chord: string): string {
  if (!chord) return '';
  
  // Remove spaces and convert to uppercase
  let normalized = chord.trim().toUpperCase();
  
  // Handle enharmonic equivalents - convert sharps to flats for consistency
  const enharmonicMap: { [key: string]: string } = {
    'C#': 'DB',
    'D#': 'EB',
    'F#': 'GB',
    'G#': 'AB',
    'A#': 'BB'
  };
  
  // Check if chord starts with a sharp note and convert to flat
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat);
      break;
    }
  }
  
  return normalized;
}

/**
 * Check if a chord is considered "easy" for beginners
 * Easy chords are those without barre chords, sharps, or flats
 */
export function isEasyChord(chord: string): boolean {
  if (!chord) return false;
  
  const normalized = normalizeChord(chord);
  
  // Check if it's in our easy chords list
  if (EASY_CHORDS.has(normalized)) {
    return true;
  }
  
  // Check for difficult patterns
  // Chords with sharps or flats (except those already normalized and in easy list)
  if (/[#B]/.test(chord) && !EASY_CHORDS.has(normalized)) {
    return false;
  }
  
  // Chords that typically require barre (F, B, Bb, etc.)
  if (/^[FB]/.test(normalized) && !EASY_CHORDS.has(normalized)) {
    return false;
  }
  
  // Complex chord types (dim, aug, sus with numbers other than 4, add with numbers other than 9)
  if (/dim|aug|sus[^4]|add[^9]/.test(normalized)) {
    return false;
  }
  
  // If it's a simple major chord pattern (C, D, E, G, A with optional 7, maj7, sus4, add9)
  const simpleMajorPattern = /^[CDEGA](7|MAJ7|SUS4|ADD9)?$/i;
  if (simpleMajorPattern.test(normalized)) {
    return true;
  }
  
  // Minor versions of simple chords (Am, Dm, Em with optional 7)
  const simpleMinorPattern = /^[ADE]M(7)?$/i;
  if (simpleMinorPattern.test(normalized)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a song has only easy chords
 * @param allChords Array of all unique chords in the song
 * @returns true if all chords are easy, false otherwise
 */
export function songHasOnlyEasyChords(allChords: string[] | null | undefined): boolean {
  if (!allChords || allChords.length === 0) {
    // If no chords are stored, we can't determine difficulty
    // Return false to filter out songs without chord data when filter is active
    return false;
  }
  
  // Check each chord - all must be easy
  return allChords.every(chord => isEasyChord(chord));
}

/**
 * Find the best transposition that maximizes the number of easy chords (accords magiques)
 * This function checks if all chords are already "magical" (easy). If yes, no transposition is needed.
 * Otherwise, it finds the closest transposition that maximizes the number of easy chords.
 * 
 * @param allChords Array of all unique chords in the song (from all_chords field in database)
 * @returns Object with semitones (transposition value) and easyCount (number of easy chords after transposition)
 */
export function findBestEasyChordTransposition(allChords: string[] | null | undefined): { semitones: number; easyCount: number } {
  // Handle edge cases: no chords or empty array
  if (!allChords || allChords.length === 0) {
    return { semitones: 0, easyCount: 0 };
  }

  // Step 1: Vérification initiale - Check if all chords are already "magical" (easy)
  const totalChords = allChords.length;
  let easyChordsCount = 0;
  
  for (const chord of allChords) {
    if (isEasyChord(chord)) {
      easyChordsCount++;
    }
  }

  // If all chords are already easy, no transposition needed
  if (easyChordsCount === totalChords) {
    return { semitones: 0, easyCount: totalChords };
  }

  // Step 2: Recherche de transposition optimale
  // Start with current state (no transposition) as the baseline
  let bestTransposition = { semitones: 0, easyCount: easyChordsCount };

  // Test all possible transpositions from -11 to +11 semitones
  // We iterate in a way that tests closer transpositions first (±1, ±2, etc.)
  // This ensures that if multiple transpositions have the same score, we prefer the closest one
  for (let offset = 1; offset <= 11; offset++) {
    // Test both positive and negative transpositions at the same distance
    const semitonesOptions = [offset, -offset];
    
    for (const semitones of semitonesOptions) {
      let transposedEasyCount = 0;
      
      // Transpose all chords and count how many become easy after transposition
      for (const chord of allChords) {
        try {
          const transposedChord = transposeChord(chord, semitones);
          if (isEasyChord(transposedChord)) {
            transposedEasyCount++;
          }
        } catch (error) {
          // If transposition fails for a chord, skip it (don't count as easy)
          // This handles invalid chord formats gracefully
          console.warn(`Failed to transpose chord "${chord}" by ${semitones} semitones:`, error);
        }
      }

      // Update best transposition if:
      // 1. This transposition has more easy chords, OR
      // 2. Same number of easy chords but this one has a smaller absolute value (closer to 0)
      const isBetter = transposedEasyCount > bestTransposition.easyCount ||
        (transposedEasyCount === bestTransposition.easyCount && 
         Math.abs(semitones) < Math.abs(bestTransposition.semitones));
      
      if (isBetter) {
        bestTransposition = { semitones, easyCount: transposedEasyCount };
      }
      
      // If we found a transposition that makes ALL chords easy, we can stop early
      if (bestTransposition.easyCount === totalChords) {
        return bestTransposition;
      }
    }
  }

  return bestTransposition;
}

/**
 * Calculate chord difficulty based on chord structure
 * @param chord Chord object with chordData
 * @returns 'beginner' | 'intermediate' | 'advanced'
 */
export function getChordDifficulty(chord: { chordData: { barres: any[]; position: number }; name: string }): 'beginner' | 'intermediate' | 'advanced' {
  // Beginner: accords ouverts, pas de barres, position 0
  if (chord.chordData.barres.length === 0 && chord.chordData.position === 0) {
    // Check if it's a simple open chord by name
    const simpleOpenChords = ['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'C7', 'D7', 'E7', 'G7', 'A7', 'Am7', 'Dm7', 'Em7'];
    if (simpleOpenChords.some(c => chord.name.includes(c) && !chord.name.includes('Barre'))) {
      return 'beginner';
    }
    // If no barres and position 0, likely beginner
    return 'beginner';
  }
  
  // Intermediate: barres simples, position basse (1-3)
  if (chord.chordData.barres.length === 1 && chord.chordData.position <= 3) {
    return 'intermediate';
  }
  
  // Advanced: barres multiples, position haute (>3), ou accords complexes
  if (chord.chordData.barres.length > 1 || chord.chordData.position > 3) {
    return 'advanced';
  }
  
  // Check chord name for complex patterns
  const chordName = chord.name.toUpperCase();
  if (chordName.includes('DIM') || chordName.includes('AUG') || 
      chordName.includes('9') || chordName.includes('11') || chordName.includes('13')) {
    return 'advanced';
  }
  
  // Default to intermediate if unclear
  return 'intermediate';
}

/**
 * Calculate learning order for a chord
 * Lower numbers = learn first
 * @param chord Chord object
 * @returns number representing learning order
 */
export function calculateLearningOrder(chord: { chordData: { barres: any[]; position: number }; name: string; section: string }): number {
  const difficulty = getChordDifficulty(chord);
  
  // Base order by difficulty: beginner = 0-999, intermediate = 1000-1999, advanced = 2000+
  let baseOrder = 0;
  if (difficulty === 'intermediate') baseOrder = 1000;
  if (difficulty === 'advanced') baseOrder = 2000;
  
  // Within each difficulty, order by section
  let sectionOrder = 0;
  if (chord.section === 'Open Chords') sectionOrder = 0;
  else if (chord.section === 'E-Shape Barre Chords') sectionOrder = 100;
  else if (chord.section === 'A-Shape Barre Chords') sectionOrder = 200;
  
  // Within section, order by position (lower position = learn first)
  const positionOrder = chord.chordData.position * 10;
  
  // Within position, order by number of barres (fewer barres = learn first)
  const barreOrder = chord.chordData.barres.length;
  
  return baseOrder + sectionOrder + positionOrder + barreOrder;
}

