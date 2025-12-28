// Chord utilities for transposition and recognition
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ENHARMONIC_MAP: { [key: string]: string } = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
};

// Guitar chord shapes (6 strings, -1 = muted, 0 = open, >0 = fret)
export const GUITAR_SHAPES: { [key: string]: number[] } = {
  // Natural chords
  "C": [-1, 3, 2, 0, 1, 0],
  "Cm": [-1, 3, 5, 5, 4, 3],
  "C7": [-1, 3, 2, 3, 1, 0],
  "Cmaj7": [-1, 3, 2, 0, 0, 0],
  "D": [-1, -1, 0, 2, 3, 2],
  "Dm": [-1, -1, 0, 2, 3, 1],
  "D7": [-1, -1, 0, 2, 1, 2],
  "Dm7": [-1, -1, 0, 2, 1, 1],
  "E": [0, 2, 2, 1, 0, 0],
  "Em": [0, 2, 2, 0, 0, 0],
  "Em7": [0, 2, 2, 0, 3, 0],
  "E7": [0, 2, 0, 1, 0, 0],
  "F": [1, 3, 3, 2, 1, 1],
  "Fm": [1, 3, 3, 1, 1, 1],
  "G": [3, 2, 0, 0, 0, 3],
  "Gm": [3, 5, 5, 3, 3, 3],
  "G7": [3, 2, 0, 0, 0, 1],
  "A": [-1, 0, 2, 2, 2, 0],
  "Am": [-1, 0, 2, 2, 1, 0],
  "Am7": [-1, 0, 2, 0, 1, 0],
  "A7": [-1, 0, 2, 0, 2, 0],
  "B": [-1, 2, 4, 4, 4, 2],
  "Bm": [-1, 2, 4, 4, 3, 2],
  "Bm7": [-1, 2, 0, 2, 2, 2],

  // Sharp chords
  "C#": [-1, -1, 3, 1, 2, 1],
  "C#m": [-1, -1, 2, 1, 2, 0],
  "D#": [-1, -1, 1, 3, 4, 3],
  "D#m": [-1, -1, 4, 3, 4, 2],
  "F#": [2, 4, 4, 3, 2, 2],
  "F#m": [2, 4, 4, 2, 2, 2],
  "G#": [4, 6, 6, 5, 4, 4],
  "G#m": [4, 6, 6, 4, 4, 4],
  "A#": [-1, 1, 3, 3, 3, 1],
  "A#m": [-1, 1, 3, 3, 2, 1],

  // Flat chords (enharmonic equivalents)
  "Bb": [1, 1, 3, 3, 3, 1],
  "Bbm": [1, 1, 3, 3, 2, 1],
  "Db": [-1, -1, 3, 1, 2, 1],
  "Dbm": [-1, -1, 2, 1, 2, 0],
  "Eb": [-1, -1, 1, 3, 4, 3],
  "Ebm": [-1, -1, 4, 3, 4, 2],
  "Gb": [2, 4, 4, 3, 2, 2],
  "Gbm": [2, 4, 4, 2, 2, 2],
  "Ab": [4, 6, 6, 5, 4, 4],
  "Abm": [4, 6, 6, 4, 4, 4],

  // Suspended and add chords
  "Cadd9": [-1, 3, 2, 0, 3, 0],
  "Gsus4": [3, 2, 0, 0, 1, 3],
  "Asus4": [-1, 0, 2, 2, 3, 0],
  "Dsus4": [-1, -1, 0, 2, 3, 3]
};

// Parse chord name to extract root note and quality
export function parseChord(chord: string): { root: string; quality: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  
  return {
    root: match[1],
    quality: match[2] || ''
  };
}

/**
 * Map song chord nickname to database chord name
 * Examples:
 * - "G" -> "G Major"
 * - "Am" -> "A Minor"
 * - "C7" -> "C7"
 * - "Dsus4" -> "Dsus4"
 * - "Am7" -> "Am7"
 */
export function mapChordNicknameToDbName(chord: string): string {
  if (!chord) return chord;
  
  const parsed = parseChord(chord.trim());
  if (!parsed) return chord;
  
  const { root, quality } = parsed;
  
  // If no quality, it's a major chord
  if (!quality || quality === '') {
    return `${root} Major`;
  }
  
  // If quality is just "m", it's a minor chord
  if (quality === 'm' || quality === 'min') {
    return `${root} Minor`;
  }
  
  // For other qualities (7, sus4, m7, etc.), return as-is
  // The database stores these directly (e.g., "C7", "Am7", "Dsus4")
  return chord;
}

/**
 * Normalize chord name for comparison (converts to uppercase, handles enharmonics)
 */
export function normalizeChordNameForComparison(chord: string): string {
  if (!chord) return '';
  let normalized = chord.trim().toUpperCase();
  const enharmonicMap: { [key: string]: string } = {
    'C#': 'DB', 'D#': 'EB', 'F#': 'GB', 'G#': 'AB', 'A#': 'BB'
  };
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat);
      break;
    }
  }
  return normalized;
}

// Normalize note to use standard notation (no double sharps/flats)
export function normalizeNote(note: string): string {
  // Convert enharmonic equivalents to standard sharp notation
  const enharmonicMap: { [key: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'C##': 'D', 'D##': 'E', 'E##': 'F#', 'F##': 'G', 'G##': 'A', 'A##': 'B', 'B##': 'C',
    'Cb': 'B', 'Fb': 'E'
  };
  
  return enharmonicMap[note] || note;
}

// Post-process transposed note to avoid double sharps/flats
export function cleanTransposedNote(note: string): string {
  const cleanMap: { [key: string]: string } = {
    'C##': 'D', 'D##': 'E', 'E##': 'F#', 'F##': 'G', 'G##': 'A', 'A##': 'B', 'B##': 'C',
    'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'D#', 'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A', 'Cbb': 'A#'
  };
  
  return cleanMap[note] || note;
}

// Transpose a single chord by semitones
export function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  
  // Normalize the root note to avoid double sharps/flats
  const normalizedRoot = normalizeNote(parsed.root);
  
  // Normalize semitones to be between -11 and +11
  let normalizedSemitones = semitones;
  while (normalizedSemitones > 11) normalizedSemitones -= 12;
  while (normalizedSemitones < -11) normalizedSemitones += 12;
  
  // Try to find the note in our standard sharp notes first
  let noteIndex = NOTES.indexOf(normalizedRoot);
  let useFlats = false;
  
  if (noteIndex === -1) {
    // Try flat notes
    noteIndex = FLAT_NOTES.indexOf(normalizedRoot);
    useFlats = true;
    if (noteIndex === -1) return chord; // Note not found
  }
  
  // Calculate new index with proper wrapping for negative values
  let newIndex = (noteIndex + normalizedSemitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  // Use the same notation system (sharps or flats) as the original, but prefer sharps for consistency
  const newNote = NOTES[newIndex];
  const cleanedNote = cleanTransposedNote(newNote);
  return cleanedNote + parsed.quality;
}

// Generate all 12 keys based on chord quality (major/minor)
// If chord is minor (contains 'm' but not 'maj'), generates all minor keys
// If chord is major, generates all major keys
export function generateAllKeys(chord: string): string[] {
  if (!chord) return NOTES.filter(note => !note.includes('#')); // Default to major keys
  
  const parsed = parseChord(chord);
  if (!parsed) return NOTES.filter(note => !note.includes('#'));
  
  // Determine if chord is minor
  // Check if quality contains 'm' but not 'maj' (to handle cases like 'Amaj7')
  const isMinor = parsed.quality.includes('m') && !parsed.quality.includes('maj');
  
  // Extract base quality (just 'm' for minor, empty for major)
  const baseQuality = isMinor ? 'm' : '';
  
  // Generate all 12 keys by transposing from 0 to 11 semitones
  const keys: string[] = [];
  for (let semitones = 0; semitones < 12; semitones++) {
    const transposedChord = transposeChord(parsed.root + baseQuality, semitones);
    keys.push(transposedChord);
  }
  
  return keys;
}

// Transpose all chords in a text (smart line-by-line approach)
export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) return text;
  
  const lines = text.split('\n');
  const transposedLines = lines.map(line => {
    // Only transpose lines that are identified as chord lines
    if (isChordLine(line)) {
      return transposeChordLine(line, semitones);
    }
    return line; // Keep lyrics and other lines unchanged
  });
  
  return transposedLines.join('\n');
}

// Transpose chords in a single line
function transposeChordLine(line: string, semitones: number): string {
  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  
  return line.replace(chordPattern, (match, chord) => {
    return transposeChord(chord, semitones);
  });
}

// Helper function to detect if a match is part of a word
function isPartOfWord(match: string, text: string, offset: number): boolean {
  if (offset === undefined) return false;
  
  const before = offset > 0 ? text[offset - 1] : ' ';
  const after = offset + match.length < text.length ? text[offset + match.length] : ' ';
  
  // Skip if it's clearly part of a French/English word
  const commonWords = ['de', 'la', 'le', 'du', 'des', 'un', 'une', 'et', 'ou', 'on', 'en', 'me', 'te', 'se', 'ce', 'ma', 'ta', 'sa'];
  const lowerMatch = match.toLowerCase();
  
  if (commonWords.includes(lowerMatch)) {
    // Check context - if surrounded by letters, it's probably a word
    return /[a-zA-Z]/.test(before) || /[a-zA-Z]/.test(after);
  }
  
  return false;
}

// Detect if a line contains primarily chords
export function isChordLine(line: string): boolean {
  if (!line.trim()) return false;
  
  // Skip section headers like [Intro], [Verse 1], etc.
  if (line.trim().startsWith('[') && line.trim().endsWith(']')) return false;
  
  // Skip lines that start with common French/English words (likely lyrics)
  const lyricsIndicators = /^(je|tu|il|elle|on|nous|vous|ils|elles|le|la|les|un|une|des|du|de|et|ou|mais|donc|car|ni|or|i|you|he|she|we|they|the|a|an|and|or|but|so|for|nor|yet)/i;
  if (lyricsIndicators.test(line.trim())) return false;
  
  // Check for chord patterns (more aggressive)
  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  const matches = line.match(chordPattern) || [];
  
  // For concatenated chords (like GAm, DEm), check if the entire line is mostly chords
  const totalChordLength = matches.join('').length;
  const lineWithoutSpaces = line.replace(/\s/g, '');
  
  // If 70% of non-space characters are chords, it's a chord line
  return lineWithoutSpaces.length > 0 && (totalChordLength / lineWithoutSpaces.length) >= 0.7;
}

// Helper to get the semitone index (0-11) for a given note name
function getNoteSemitoneIndex(noteName: string): number {
  const normalized = normalizeNote(noteName);
  const index = NOTES.indexOf(normalized);
  if (index === -1) {
    // Fallback for flat notes if not in NOTES directly (e.g., Db)
    const flatIndex = FLAT_NOTES.indexOf(normalized);
    if (flatIndex !== -1) return flatIndex;
  }
  return index;
}

// Helper to convert an absolute semitone value to a note string with octave (e.g., 60 -> C4)
function getNoteFromAbsoluteSemitone(absoluteSemitone: number): string {
  const octave = Math.floor(absoluteSemitone / 12);
  const noteIndex = absoluteSemitone % 12;
  return `${NOTES[noteIndex]}${octave}`;
}

// Generate piano voicings for a chord with proper octave positioning
export function generatePianoVoicing(chord: string): string[] {
  // Handle slash chords (e.g., F#/A#)
  if (chord.includes('/')) {
    const [mainChord, bassNote] = chord.split('/');
    const mainVoicings = generatePianoVoicing(mainChord);
    const bassVoicings = generatePianoVoicing(bassNote);
    
    // Combine main chord with bass note
    if (mainVoicings.length > 0 && bassVoicings.length > 0) {
      const combinedVoicings: string[] = [];
      mainVoicings.forEach(mainVoicing => {
        bassVoicings.forEach(bassVoicing => {
          // Use the root note from bass voicing as the bass
          const bassRoot = bassVoicing.split(' ')[0];
          // Combine bass with main chord
          const combined = `${bassRoot} ${mainVoicing}`;
          combinedVoicings.push(combined);
        });
      });
      return combinedVoicings.slice(0, 3); // Limit to 3 voicings
    }
  }
  
  const parsed = parseChord(chord);
  if (!parsed) return [];

  // Normalize the root note first
  const normalizedRoot = normalizeNote(parsed.root);
  let rootIndex = NOTES.indexOf(normalizedRoot);
  
  // If still not found, try flat notes
  if (rootIndex === -1) {
    rootIndex = FLAT_NOTES.indexOf(normalizedRoot);
    if (rootIndex === -1) return [];
  }

  // Define intervals based on chord quality - ENHANCED to include all extensions
  let intervals = [0, 4, 7]; // Major triad
  
  const quality = parsed.quality.toLowerCase();
  
  // Basic chord types
  if (quality.includes('m') && !quality.includes('maj') && !quality.includes('m7')) {
    intervals = [0, 3, 7]; // Minor triad
  }
  
  // 7th chords
  if (quality.includes('maj7')) {
    intervals = [0, 4, 7, 11]; // Major 7th
  } else if (quality.includes('m7')) {
    intervals = [0, 3, 7, 10]; // Minor 7th
  } else if (quality.includes('7')) {
    intervals = [0, 4, 7, 10]; // Dominant 7th
  }
  
  // Add extensions based on chord quality
  if (quality.includes('9')) {
    intervals.push(14); // Add 9th (2nd + octave)
  }
  if (quality.includes('11')) {
    intervals.push(17); // Add 11th (4th + octave)
  }
  if (quality.includes('13')) {
    intervals.push(21); // Add 13th (6th + octave)
  }
  
  // Handle numeric extensions (4, 5, 6, etc.)
  if (quality.includes('4')) {
    intervals.push(5); // Add 4th
  }
  if (quality.includes('5')) {
    intervals.push(7); // Add 5th (though it's usually already there)
  }
  if (quality.includes('6')) {
    intervals.push(9); // Add 6th
  }
  
  // Special chord types
  if (quality.includes('sus4')) {
    intervals = [0, 5, 7]; // Suspended 4th (replace 3rd with 4th)
  } else if (quality.includes('sus2')) {
    intervals = [0, 2, 7]; // Suspended 2nd (replace 3rd with 2nd)
  }
  
  if (quality.includes('dim')) {
    intervals = [0, 3, 6]; // Diminished triad
    if (quality.includes('7')) {
      intervals.push(9); // Diminished 7th
    }
  }
  
  if (quality.includes('aug')) {
    intervals = [0, 4, 8]; // Augmented triad
  }
  
  if (quality.includes('add')) {
    if (quality.includes('add9')) {
      intervals.push(14); // Add 9th
    } else if (quality.includes('add2')) {
      intervals.push(2); // Add 2nd
    } else if (quality.includes('add4')) {
      intervals.push(5); // Add 4th
    }
  }

  const baseOctave = 4; // Start with C4 as the reference octave for the lowest note

  // Generate voicings with proper spacing
  const generateVoicing = (intervalOrder: number[]) => {
    const voicingSemitones: number[] = [];
    let currentOctave = baseOctave;
    
    intervalOrder.forEach((interval, index) => {
      const noteSemitone = rootIndex + interval + (currentOctave * 12);
      voicingSemitones.push(noteSemitone);
      
      // Move to next octave for higher intervals to avoid clustering
      if (interval >= 12) {
        currentOctave++;
      }
    });
    
    return voicingSemitones.map(getNoteFromAbsoluteSemitone).join(' ');
  };

  // Generate different voicings
  const voicings: string[] = [];
  
  // Root position voicing
  voicings.push(generateVoicing(intervals));
  
  // First inversion (move root up an octave)
  if (intervals.length >= 3) {
    const firstInversion = [...intervals.slice(1), intervals[0] + 12];
    voicings.push(generateVoicing(firstInversion));
  }
  
  // Second inversion (move root and third up an octave)
  if (intervals.length >= 3) {
    const secondInversion = [...intervals.slice(2), intervals[0] + 12, intervals[1] + 12];
    voicings.push(generateVoicing(secondInversion));
  }

  return voicings;
}

// Extract chords from text for clickable functionality
export function extractChords(text: string): string[] {
  const chordPattern = /\b([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  const matches = text.match(chordPattern) || [];
  return Array.from(new Set(matches)); // Remove duplicates
}
