// Chord utilities for transposition and recognition
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ENHARMONIC_MAP: { [key: string]: string } = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
};

// Guitar chord shapes (6 strings, -1 = muted, 0 = open, >0 = fret)
export const GUITAR_SHAPES: { [key: string]: number[] } = {
  "C": [-1, 3, 2, 0, 1, 0],
  "Cm": [-1, 3, 5, 5, 4, 3],
  "C7": [-1, 3, 2, 3, 1, 0],
  "Cmaj7": [-1, 3, 2, 0, 0, 0],
  "D": [-1, -1, 0, 2, 3, 2],
  "Dm": [-1, -1, 0, 2, 3, 1],
  "D7": [-1, -1, 0, 2, 1, 2],
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
  "Bb": [1, 1, 3, 3, 3, 1],
  "F#": [2, 4, 4, 3, 2, 2],
  "F#m": [2, 4, 4, 2, 2, 2],
  "Dm7": [-1, -1, 0, 2, 1, 1],
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

// Generate piano voicings for a chord
export function generatePianoVoicing(chord: string): string[] {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  
  const rootIndex = NOTES.indexOf(parsed.root);
  if (rootIndex === -1) return [];
  
  let intervals = [0, 4, 7]; // Major triad
  
  const quality = parsed.quality.toLowerCase();
  if (quality.includes('m') && !quality.includes('maj')) {
    intervals = [0, 3, 7]; // Minor triad
  }
  if (quality.includes('7')) {
    if (quality.includes('maj')) {
      intervals = [0, 4, 7, 11]; // Major 7th
    } else {
      intervals = [0, 4, 7, 10]; // Dominant 7th
    }
  }
  if (quality.includes('m7')) {
    intervals = [0, 3, 7, 10]; // Minor 7th
  }
  
  // Generate voicings
  const notes = intervals.map(interval => NOTES[(rootIndex + interval) % 12]);
  
  return [
    notes.join(' '), // Root position
    [notes[1], notes[2], notes[0]].join(' '), // First inversion
    [notes[2], notes[0], notes[1]].join(' ')  // Second inversion
  ];
}

// Extract chords from text for clickable functionality
export function extractChords(text: string): string[] {
  const chordPattern = /\b([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  const matches = text.match(chordPattern) || [];
  return Array.from(new Set(matches)); // Remove duplicates
}
