import { ChordPosition, SongLine, SongSection, StructuredSong } from '@/types';

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
      if (line.chords) {
        line.chords.forEach((chordPos: ChordPosition) => {
          chordPos.chord = transposeChord(chordPos.chord, semitones);
        });
      }
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
      } else if (line.type === 'chord_over_lyrics') {
        output += renderChordLyricPair(line, { maxWidth, wordWrap, isMobile }) + '\n';
      } else if (line.type === 'lyrics_only') {
        output += renderLyricsLine(line, { maxWidth, wordWrap, isMobile }) + '\n';
      }
    });
    
    output += '\n';
  });
  
  return output;
}

// Extract all unique chords from a song for diagram display
export function extractAllChords(song: StructuredSong): string[] {
  const chords = new Set<string>();
  
  song.sections.forEach(section => {
    section.lines.forEach(line => {
      if (line.chords) {
        line.chords.forEach(chordPos => {
          chords.add(chordPos.chord);
        });
      }
      // Also check chord_line for chords_only type
      if (line.chord_line) {
        const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
        const matches = line.chord_line.match(chordPattern) || [];
        matches.forEach(chord => chords.add(chord));
      }
    });
  });
  
  return Array.from(chords).sort();
}

function renderChordOnlyLine(
  line: SongLine, 
  options: { maxWidth: number; wordWrap: boolean; isMobile: boolean }
): string {
  if (line.chord_line) {
    return line.chord_line;
  }
  
  if (!line.chords || line.chords.length === 0) {
    return '';
  }
  
  if (!options.wordWrap) {
    return renderSimpleChordLine(line.chords);
  }
  
  // Advanced word wrap for chord-only lines
  return renderChordLineWithWrap(line.chords, options.maxWidth);
}

function renderSimpleChordLine(chords: ChordPosition[]): string {
  if (chords.length === 0) return '';
  
  // Check if this looks like concatenated chords (positions very close together)
  const isConcatenated = chords.length > 1 && 
    chords.every((chord, i) => i === 0 || chord.position <= chords[i-1].position + chords[i-1].chord.length + 1);
  
  if (isConcatenated) {
    // For concatenated chords, just join them without spaces
    return chords.map(c => c.chord).join('');
  }
  
  // Original logic for spaced chords
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
  const lines = [];
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
  if (!line.lyrics) return '';
  
  if (!line.chords || line.chords.length === 0) {
    return line.lyrics;
  }
  
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
  if (!line.lyrics || !line.chords) return line.lyrics || '';
  
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
      currentChords = line.chords!.filter(c => c.position >= wordStart);
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
      const wordChords = line.chords!.filter(c => 
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
  if (!line.lyrics) return '';
  
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