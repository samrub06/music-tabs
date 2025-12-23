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
 * Find the best transposition that maximizes the number of easy chords
 * @param allChords Array of all unique chords in the song
 * @returns Object with semitones (transposition value) and easyCount (number of easy chords after transposition)
 */
export function findBestEasyChordTransposition(allChords: string[] | null | undefined): { semitones: number; easyCount: number } {
  // If no chords, return no transposition needed
  if (!allChords || allChords.length === 0) {
    return { semitones: 0, easyCount: 0 };
  }

  // Check if all chords are already easy
  const currentEasyCount = allChords.filter(chord => isEasyChord(chord)).length;
  if (currentEasyCount === allChords.length) {
    return { semitones: 0, easyCount: allChords.length };
  }

  let bestTransposition = { semitones: 0, easyCount: currentEasyCount };

  // Test all possible transpositions from -11 to +11 semitones
  for (let semitones = -11; semitones <= 11; semitones++) {
    if (semitones === 0) continue; // Already checked above

    // Transpose all chords and count easy ones
    let easyCount = 0;
    for (const chord of allChords) {
      try {
        const transposedChord = transposeChord(chord, semitones);
        if (isEasyChord(transposedChord)) {
          easyCount++;
        }
      } catch (error) {
        // If transposition fails, skip this chord
        console.warn(`Failed to transpose chord ${chord} by ${semitones} semitones:`, error);
      }
    }

    // Update best transposition if this one has more easy chords
    // If tied, prefer the transposition with smaller absolute value
    if (
      easyCount > bestTransposition.easyCount ||
      (easyCount === bestTransposition.easyCount && Math.abs(semitones) < Math.abs(bestTransposition.semitones))
    ) {
      bestTransposition = { semitones, easyCount };
    }
  }

  return bestTransposition;
}

