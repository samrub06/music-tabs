// Chord analysis utilities for medley generation

export interface ChordInfo {
  chord: string;
  position: 'first' | 'last';
  section: string;
  line: number;
}

export interface SongChordAnalysis {
  firstChord?: string;
  lastChord?: string;
  chordProgression?: string[];
  key?: string;
  capo?: number;
}

// Common chord patterns and their relationships
const CHORD_RELATIONS = {
  // Perfect cadences (V -> I) - Les plus fortes
  'G->C': 8, 'D->G': 8, 'A->D': 8, 'E->A': 8, 'B->E': 8, 'F#->B': 8,
  'C->F': 8, 'F->Bb': 8, 'Bb->Eb': 8, 'Eb->Ab': 8, 'Ab->Db': 8, 'Db->Gb': 8,
  
  // Plagal cadences (IV -> I) - Très bonnes
  'F->C': 7, 'Bb->F': 7, 'Eb->Bb': 7, 'Ab->Eb': 7, 'Db->Ab': 7, 'Gb->Db': 7,
  
  // Relative major/minor - Excellentes transitions
  'Am->C': 6, 'C->Am': 6, 'Em->G': 6, 'G->Em': 6, 'Bm->D': 6, 'D->Bm': 6,
  'F#m->A': 6, 'A->F#m': 6, 'C#m->E': 6, 'E->C#m': 6, 'G#m->B': 6, 'B->G#m': 6,
  'Dm->F': 6, 'F->Dm': 6, 'Gm->Bb': 6, 'Bb->Gm': 6, 'Cm->Eb': 6, 'Eb->Cm': 6,
  
  // Circle of fifths (adjacent) - Bonnes transitions
  'F#->C#': 5, 'C#->G#': 5, 'G#->D#': 5, 'D#->A#': 5, 'A#->F': 5,
  
  // Same chord - Parfait pour la continuité
  'C->C': 9, 'G->G': 9, 'D->D': 9, 'A->A': 9, 'E->E': 9, 'B->B': 9,
  'F->F': 9, 'Bb->Bb': 9, 'Eb->Eb': 9, 'Ab->Ab': 9, 'Db->Db': 9, 'Gb->Gb': 9,
  
  // Minor chords - Même logique
  'Am->Am': 9, 'Em->Em': 9, 'Bm->Bm': 9, 'F#m->F#m': 9, 'C#m->C#m': 9,
  'G#m->G#m': 9, 'D#m->D#m': 9, 'A#m->A#m': 9, 'Fm->Fm': 9, 'Cm->Cm': 9,
  'Gm->Gm': 9, 'Dm->Dm': 9,
  
  // Transitions par tierces (très musicales)
  'C->E': 4, 'E->C': 4, 'G->B': 4, 'B->G': 4, 'D->F#': 4, 'F#->D': 4,
  'A->C#': 4, 'C#->A': 4, 'Bb->D': 4, 'D->Bb': 4,
  'Eb->G': 4, 'G->Eb': 4, 'Ab->C': 4, 'C->Ab': 4, 'Db->F': 4, 'F->Db': 4,
  
  // Transitions par secondes (proches)
  'C->D': 3, 'D->C': 3, 'D->E': 3, 'E->D': 3, 'E->F': 3, 'F->E': 3,
  'F->G': 3, 'G->F': 3, 'G->A': 3, 'A->G': 3, 'A->B': 3, 'B->A': 3,
  'B->C': 3, 'C->B': 3,
};

// Normalize chord names for comparison
export function normalizeChord(chord: string): string {
  if (!chord) return '';
  
  // Remove extra spaces and convert to uppercase
  let normalized = chord.trim().toUpperCase();
  
  // Handle common variations
  normalized = normalized.replace(/MAJ7/g, 'maj7');
  normalized = normalized.replace(/MIN7/g, 'm7');
  normalized = normalized.replace(/DIM/g, 'dim');
  normalized = normalized.replace(/AUG/g, 'aug');
  
  // Handle slash chords (keep only the root)
  if (normalized.includes('/')) {
    normalized = normalized.split('/')[0];
  }
  
  // Handle sus chords
  normalized = normalized.replace(/SUS[24]?/g, '');
  
  // Handle add chords
  normalized = normalized.replace(/ADD[0-9]+/g, '');
  
  return normalized;
}

// Extract chords from a line of text
export function extractChordsFromLine(line: string): string[] {
  if (!line) return [];
  
  // Common chord patterns
  const chordPattern = /[A-G][#b]?(maj7|m7|7|m|dim|aug|sus[24]?|add[0-9]+)?(\/[A-G][#b]?)?/gi;
  const matches = line.match(chordPattern);
  
  if (!matches) return [];
  
  return matches.map(chord => normalizeChord(chord));
}

// Analyze a song's content to extract chord information
export function analyzeSongChords(content: string, key?: string, capo?: number): SongChordAnalysis {
  if (!content) return {};
  
  const lines = content.split('\n');
  const chords: ChordInfo[] = [];
  
  // Extract chords from each line
  lines.forEach((line, lineIndex) => {
    const lineChords = extractChordsFromLine(line);
    lineChords.forEach(chord => {
      chords.push({
        chord,
        position: 'first', // Will be updated later
        section: 'unknown',
        line: lineIndex
      });
    });
  });
  
  if (chords.length === 0) return {};
  
  // Determine first and last chords
  const firstChord = chords[0]?.chord;
  const lastChord = chords[chords.length - 1]?.chord;
  
  // Create chord progression (simplified)
  const chordProgression = chords.map(c => c.chord);
  
  return {
    firstChord,
    lastChord,
    chordProgression,
    key,
    capo
  };
}

// Analyze a structured song to extract chord information
export function analyzeStructuredSongChords(song: any, key?: string, capo?: number): SongChordAnalysis {
  if (!song || !song.sections) return {};
  
  const chords: ChordInfo[] = [];
  
  // Extract chords from all sections
  song.sections.forEach((section: any, sectionIndex: number) => {
    if (section.lines) {
      section.lines.forEach((line: any, lineIndex: number) => {
        // Handle chord_over_lyrics lines
        if (line.type === 'chord_over_lyrics' && line.chords) {
          line.chords.forEach((chordObj: any) => {
            chords.push({
              chord: chordObj.chord,
              position: 'first', // Will be updated later
              section: section.name || 'unknown',
              line: lineIndex
            });
          });
        }
        
        // Handle chords_only lines
        if (line.type === 'chords_only' && line.chord_line) {
          const lineChords = extractChordsFromLine(line.chord_line);
          lineChords.forEach(chord => {
            chords.push({
              chord,
              position: 'first', // Will be updated later
              section: section.name || 'unknown',
              line: lineIndex
            });
          });
        }
      });
    }
  });
  
  if (chords.length === 0) return {};
  
  // Determine first and last chords
  const firstChord = chords[0]?.chord;
  const lastChord = chords[chords.length - 1]?.chord;
  
  // Create chord progression (simplified)
  const chordProgression = chords.map(c => c.chord);
  
  return {
    firstChord,
    lastChord,
    chordProgression,
    key,
    capo
  };
}

// Calculate transition score between two chords
export function calculateChordTransitionScore(fromChord: string, toChord: string): number {
  if (!fromChord || !toChord) return 0;
  
  const normalizedFrom = normalizeChord(fromChord);
  const normalizedTo = normalizeChord(toChord);
  
  // Check for exact match
  if (normalizedFrom === normalizedTo) return 5;
  
  // Check for known relationships
  const relationKey = `${normalizedFrom}->${normalizedTo}`;
  if (CHORD_RELATIONS[relationKey as keyof typeof CHORD_RELATIONS]) {
    return CHORD_RELATIONS[relationKey as keyof typeof CHORD_RELATIONS];
  }
  
  // Check for relative major/minor relationships
  const relativeKey = `${normalizedTo}->${normalizedFrom}`;
  if (CHORD_RELATIONS[relativeKey as keyof typeof CHORD_RELATIONS]) {
    return CHORD_RELATIONS[relativeKey as keyof typeof CHORD_RELATIONS];
  }
  
  // Basic scoring based on chord similarity
  if (normalizedFrom[0] === normalizedTo[0]) {
    return 2; // Same root note
  }
  
  return 1; // Default low score
}

// Calculate overall transition score between two songs
export function calculateSongTransitionScore(song1: SongChordAnalysis, song2: SongChordAnalysis): number {
  let score = 0;
  
  // Score based on last chord of song1 to first chord of song2
  if (song1.lastChord && song2.firstChord) {
    score += calculateChordTransitionScore(song1.lastChord, song2.firstChord) * 3; // Weight this heavily
  }
  
  // Score based on key relationships
  if (song1.key && song2.key) {
    // This would use the existing key scoring logic
    score += 1; // Placeholder for now
  }
  
  return score;
}

// Apply capo transposition to a chord
export function transposeChord(chord: string, capo: number): string {
  if (!chord || capo === 0) return chord;
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const root = chord[0];
  const rootIndex = notes.indexOf(root);
  
  if (rootIndex === -1) return chord;
  
  const newRootIndex = (rootIndex + capo) % 12;
  const newRoot = notes[newRootIndex];
  
  return newRoot + chord.substring(1);
}
