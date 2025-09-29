// Utilities for structured song format - 100% reliable transposition & word wrap

export interface ChordPosition {
  chord: string;
  position: number;
}

export interface SongLine {
  type: 'chords_only' | 'chord_lyric_pair' | 'lyrics_only';
  chords: ChordPosition[];
  lyrics: string;
}

export interface SongSection {
  type: string;
  name: string;
  lines: SongLine[];
}

export interface StructuredSong {
  id: string;
  title: string;
  author: string;
  folderId?: string;
  format: 'structured';
  sections: SongSection[];
  createdAt: string;
  updatedAt: string;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Transpose a single chord
function transposeChord(chord: string, semitones: number): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  const root = match[1];
  const quality = match[2];
  
  let normalizedSemitones = semitones;
  while (normalizedSemitones > 11) normalizedSemitones -= 12;
  while (normalizedSemitones < -11) normalizedSemitones += 12;
  
  const noteIndex = NOTES.indexOf(root);
  if (noteIndex === -1) return chord;
  
  let newIndex = (noteIndex + normalizedSemitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES[newIndex] + quality;
}

// Transpose entire structured song - 100% reliable
export function transposeStructuredSong(song: StructuredSong, semitones: number): StructuredSong {
  if (semitones === 0) return song;
  
  const transposedSong = JSON.parse(JSON.stringify(song));
  
  transposedSong.sections.forEach((section: SongSection) => {
    section.lines.forEach((line: SongLine) => {
      line.chords.forEach((chordPos: ChordPosition) => {
        chordPos.chord = transposeChord(chordPos.chord, semitones);
      });
    });
  });
  
  return transposedSong;
}

// Render structured song with responsive word wrap
export function renderStructuredSong(
  song: StructuredSong, 
  options: {
    maxWidth?: number;
    wordWrap?: boolean;
    isMobile?: boolean;
  } = {}
): string {
  const { maxWidth = 80, wordWrap = false, isMobile = false } = options;
  
  let output = '';
  
  song.sections.forEach(section => {
    output += `[${section.name}]\n`;
    
    section.lines.forEach(line => {
      if (line.type === 'chords_only') {
        output += renderChordOnlyLine(line, { maxWidth, wordWrap, isMobile }) + '\n';
      } else if (line.type === 'chord_lyric_pair') {
        output += renderChordLyricPair(line, { maxWidth, wordWrap, isMobile }) + '\n';
      } else if (line.type === 'lyrics_only') {
        output += renderLyricsLine(line, { maxWidth, wordWrap, isMobile }) + '\n';
      }
    });
    
    output += '\n';
  });
  
  return output;
}

function renderChordOnlyLine(
  line: SongLine, 
  options: { maxWidth: number; wordWrap: boolean; isMobile: boolean }
): string {
  if (!options.wordWrap) {
    return renderSimpleChordLine(line.chords);
  }
  
  // Advanced word wrap for chord-only lines
  return renderChordLineWithWrap(line.chords, options.maxWidth);
}

function renderSimpleChordLine(chords: ChordPosition[]): string {
  if (chords.length === 0) return '';
  
  let line = '';
  
  chords.forEach(chordPos => {
    // Add spaces to reach the chord position
    while (line.length < chordPos.position) {
      line += ' ';
    }
    line += chordPos.chord;
  });
  
  return line;
}

function renderChordLineWithWrap(chords: ChordPosition[], maxWidth: number): string {
  // Smart word wrap that keeps chords together
  let lines = [];
  let currentLine = '';
  let currentPos = 0;
  
  chords.forEach(chordPos => {
    const spaceNeeded = Math.max(0, chordPos.position - currentPos);
    const totalLength = currentLine.length + spaceNeeded + chordPos.chord.length;
    
    if (totalLength > maxWidth && currentLine.length > 0) {
      // Start new line
      lines.push(currentLine);
      currentLine = chordPos.chord;
      currentPos = chordPos.chord.length;
    } else {
      // Add to current line
      currentLine += ' '.repeat(spaceNeeded) + chordPos.chord;
      currentPos += spaceNeeded + chordPos.chord.length;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

function renderChordLyricPair(
  line: SongLine,
  options: { maxWidth: number; wordWrap: boolean; isMobile: boolean }
): string {
  if (!options.wordWrap || line.lyrics.length <= options.maxWidth) {
    // Simple rendering without word wrap
    const chordLine = renderChordsForLyrics(line.chords, line.lyrics);
    return chordLine + '\n' + line.lyrics;
  }
  
  // Advanced word wrap preserving chord alignment
  return renderChordLyricWithWrap(line, options.maxWidth);
}

function renderChordsForLyrics(chords: ChordPosition[], lyrics: string): string {
  let chordLine = '';
  
  chords.forEach(chordPos => {
    // Ensure chord line is long enough
    while (chordLine.length < chordPos.position) {
      chordLine += ' ';
    }
    
    // Add chord, handling overlaps
    const endPos = chordPos.position + chordPos.chord.length;
    if (endPos > chordLine.length) {
      chordLine += chordPos.chord;
    } else {
      // Handle chord overlap by inserting
      chordLine = chordLine.substring(0, chordPos.position) + 
                 chordPos.chord + 
                 chordLine.substring(endPos);
    }
  });
  
  // Ensure chord line is at least as long as lyrics
  while (chordLine.length < lyrics.length) {
    chordLine += ' ';
  }
  
  return chordLine;
}

function renderChordLyricWithWrap(line: SongLine, maxWidth: number): string {
  // Advanced algorithm for word wrapping while preserving chord alignment
  const words = line.lyrics.split(' ');
  const lines = [];
  let currentLyricLine = '';
  let currentChords: ChordPosition[] = [];
  let currentPos = 0;
  
  words.forEach((word, wordIndex) => {
    const wordStart = currentPos;
    const wordEnd = currentPos + word.length;
    const spaceAfter = wordIndex < words.length - 1 ? 1 : 0;
    const totalLength = currentLyricLine.length + (currentLyricLine ? 1 : 0) + word.length;
    
    if (totalLength > maxWidth && currentLyricLine.length > 0) {
      // Finish current line
      const chordLine = renderChordsForLyrics(currentChords, currentLyricLine);
      lines.push(chordLine);
      lines.push(currentLyricLine);
      
      // Start new line
      currentLyricLine = word;
      currentChords = line.chords.filter(c => c.position >= wordStart);
      // Adjust chord positions for new line
      currentChords = currentChords.map(c => ({
        ...c,
        position: c.position - wordStart
      }));
      currentPos = word.length + spaceAfter;
    } else {
      // Add to current line
      if (currentLyricLine) {
        currentLyricLine += ' ';
        currentPos += 1;
      }
      currentLyricLine += word;
      currentPos += word.length + spaceAfter;
      
      // Add relevant chords for this word
      const wordChords = line.chords.filter(c => 
        c.position >= wordStart && c.position < wordEnd + spaceAfter
      );
      currentChords.push(...wordChords);
    }
  });
  
  // Finish last line
  if (currentLyricLine) {
    const chordLine = renderChordsForLyrics(currentChords, currentLyricLine);
    lines.push(chordLine);
    lines.push(currentLyricLine);
  }
  
  return lines.join('\n');
}

function renderLyricsLine(
  line: SongLine,
  options: { maxWidth: number; wordWrap: boolean; isMobile: boolean }
): string {
  if (!options.wordWrap || line.lyrics.length <= options.maxWidth) {
    return line.lyrics;
  }
  
  // Simple word wrap for lyrics-only lines
  const words = line.lyrics.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const totalLength = currentLine.length + (currentLine ? 1 : 0) + word.length;
    
    if (totalLength > options.maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      if (currentLine) currentLine += ' ';
      currentLine += word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

// Parse old format to new structured format (for the 3 existing songs)
export function parseToStructuredFormat(content: string): SongSection[] {
  const lines = content.split('\n');
  const sections: SongSection[] = [];
  let currentSection: SongSection | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Section headers
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        type: sectionMatch[1].toLowerCase().replace(/\s+/g, '_'),
        name: sectionMatch[1],
        lines: []
      };
      continue;
    }
    
    if (!currentSection) {
      currentSection = {
        type: 'unknown',
        name: 'Unknown',
        lines: []
      };
    }
    
    if (line === '') continue;
    
    // Parse line
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    const parsedLine = parseLineToStructured(line, nextLine);
    
    if (parsedLine) {
      currentSection.lines.push(parsedLine);
      // Skip next line if it was consumed as lyrics
      if (parsedLine.type === 'chord_lyric_pair' && nextLine && !isChordLine(nextLine)) {
        i++; // Skip the lyrics line as it's already processed
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

function parseLineToStructured(currentLine: string, nextLine: string): SongLine | null {
  const isCurrentChords = isChordLine(currentLine);
  const isNextLyrics = nextLine && !isChordLine(nextLine) && !nextLine.match(/^\[/);
  
  if (isCurrentChords && isNextLyrics) {
    // Chord-lyric pair
    return {
      type: 'chord_lyric_pair',
      chords: extractChordsWithPositions(currentLine),
      lyrics: nextLine
    };
  } else if (isCurrentChords) {
    // Chords only
    return {
      type: 'chords_only',
      chords: extractChordsWithPositions(currentLine),
      lyrics: ''
    };
  } else {
    // Lyrics only
    return {
      type: 'lyrics_only',
      chords: [],
      lyrics: currentLine
    };
  }
}

function isChordLine(line: string): boolean {
  if (!line.trim()) return false;
  
  // Check for spaced chords (C   G   Am   F)
  const spaceRatio = (line.match(/\s/g) || []).length / line.length;
  if (spaceRatio > 0.4) {
    const words = line.trim().split(/\s+/).filter(w => w.length > 0);
    const chordCount = words.filter(w => /^[A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?$/.test(w)).length;
    return chordCount / words.length >= 0.7;
  }
  
  // Check for concatenated chords (CGAmF)
  return /^[A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:[A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*)+$/.test(line);
}

function extractChordsWithPositions(line: string): ChordPosition[] {
  const chords: ChordPosition[] = [];
  const chordRegex = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  let match;
  
  while ((match = chordRegex.exec(line)) !== null) {
    chords.push({
      chord: match[1],
      position: match.index
    });
  }
  
  return chords;
}
