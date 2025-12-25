import { ChordPosition, SongLine, SongSection, StructuredSong } from '@/types';

// Parser optimisé avec positions précises
export function parseTextToStructuredSong(
  title: string,
  author: string,
  content: string,
  folderId?: string,
  reviews?: number,
  capo?: number,
  key?: string
): StructuredSong {
  const lines = content.split('\n');
  const sections: SongSection[] = [];
  let currentSection: SongSection | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Skip completely empty lines
    if (!line && !line.trim()) continue;
    
    // Detect section headers [Intro], [Verse 1], [Chorus], etc.
    const sectionMatch = line.match(/^\[(.*)\]$/);
    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      
      // Start new section
      const sectionName = sectionMatch[1];
      currentSection = {
        type: getSectionType(sectionName),
        name: sectionName,
        lines: []
      };
      continue;
    }
    
    // Handle capo indication
    if (line.match(/^🎸?\s*Capo\s+\d+/i)) {
      if (!currentSection) {
        currentSection = {
          type: 'intro',
          name: 'Metadata',
          lines: []
        };
      }
      currentSection.lines.push({
        type: 'lyrics_only',
        lyrics: line.trim()
      });
      continue;
    }
    
    // If no section yet, create a default one
    if (!currentSection) {
      currentSection = {
        type: 'verse',
        name: 'Content',
        lines: []
      };
    }
    
    // Parse the line based on patterns
    const parsedLine = parseLinePattern(line, nextLine);
    if (parsedLine) {
      currentSection.lines.push(parsedLine);
      
      // If we consumed the next line, skip it
      if (parsedLine.type === 'chord_over_lyrics') {
        i++; // Skip the lyrics line as it's already processed
      }
    }
  }
  
  // Add the last section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }
  
  // Determine first chord from the first chords_only line
  let firstChordFromSections: string | undefined;
  for (const section of sections) {
    for (const line of section.lines) {
      if (line.type === 'chords_only' && line.chord_line) {
        const matchedChords = line.chord_line.match(/([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g) || [];
        if (matchedChords[0]) {
          firstChordFromSections = matchedChords[0];
          break;
        }
      }
    }
    if (firstChordFromSections) break;
  }
  
  // Determine last chord from the parsed sections
  let lastChordFromSections: string | undefined;
  for (const section of sections) {
    for (const line of section.lines) {
      if (line.type === 'chords_only' && line.chord_line) {
        const matchedChords = line.chord_line.match(/([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g) || [];
        if (matchedChords.length > 0) {
          lastChordFromSections = matchedChords[matchedChords.length - 1];
        }
      } else if (line.type === 'chord_over_lyrics' && line.chords && line.chords.length > 0) {
        lastChordFromSections = line.chords[line.chords.length - 1].chord;
      }
    }
  }
  
  // Simple chord extraction
  //imagine Dm Gm Am

  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  const chords = content.match(chordPattern) || [];
  
  return {
    id: '', // Will be set by the API
    title,
    author,
    folderId,
    format: 'structured',
    sections,
    createdAt: new Date(),
    updatedAt: new Date(),
    content,
    reviews: reviews || 0,
    capo: capo || undefined,
    key: key || firstChordFromSections || chords[0] || '',
    soundingKey: undefined, // Will be calculated when needed
    firstChord: firstChordFromSections || chords[0] || '',
    lastChord: lastChordFromSections || (chords.length > 0 ? chords[chords.length - 1] : ''),
    chordProgression: chords
  };
}

// Determine section type from name
function getSectionType(sectionName: string): string {
  const name = sectionName.toLowerCase();
  if (name.includes('intro')) return 'intro';
  if (name.includes('verse')) return 'verse';
  if (name.includes('chorus') || name.includes('refrain')) return 'chorus';
  if (name.includes('bridge')) return 'bridge';
  if (name.includes('outro')) return 'outro';
  return 'verse'; // default
}

// Parse individual line patterns with PRECISE positioning
function parseLinePattern(currentLine: string, nextLine?: string): SongLine | null {
  const trimmedCurrent = currentLine.trim();
  const trimmedNext = nextLine?.trim();
  
  // Empty line
  if (!trimmedCurrent) {
    return {
      type: 'lyrics_only',
      lyrics: ''
    };
  }
  
  // Pattern 1: Pure chord line
  if (isPureChordLine(trimmedCurrent)) {
    // Check if next line is lyrics (chord over lyrics pattern)
    if (trimmedNext && !isPureChordLine(trimmedNext) && !trimmedNext.match(/^\[.*\]$/)) {
      // Calculate precise chord positions
      const chordPositions = calculateChordPositions(currentLine, nextLine || '');
      
      return {
        type: 'chord_over_lyrics',
        lyrics: trimmedNext,
        chords: chordPositions
      };
    } else {
      // Just chords alone
      return {
        type: 'chords_only',
        chord_line: trimmedCurrent
      };
    }
  }
  
  // Pattern 2: Pure lyrics line
  return {
    type: 'lyrics_only',
    lyrics: trimmedCurrent
  };
}

// Calculate exact chord positions relative to lyrics
function calculateChordPositions(chordLine: string, lyricLine: string): ChordPosition[] {
  const positions: ChordPosition[] = [];
  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  
  // Track positions to avoid duplicates
  const positionMap = new Map<number, ChordPosition>();
  
  let match;
  while ((match = chordPattern.exec(chordLine)) !== null) {
    const chord = match[1];
    const chordPos = match.index;
    
    // Map chord position to lyric position
    // For spaced alignment, use the chord position directly
    // For concatenated chords, distribute evenly
    let lyricPosition = chordPos;
    
    // Adjust for leading spaces in lyrics
    const lyricStart = lyricLine.search(/\S/);
    if (lyricStart > 0) {
      lyricPosition = Math.max(0, chordPos - lyricStart);
    }
    
    // Ensure position doesn't exceed lyrics length
    const maxPos = lyricLine.trim().length;
    lyricPosition = Math.min(lyricPosition, maxPos);
    
    // Check if we already have a chord at this exact position
    // If yes, skip this duplicate (keep the first one found)
    if (!positionMap.has(lyricPosition)) {
      const chordPosition: ChordPosition = {
        chord,
        position: lyricPosition
      };
      positionMap.set(lyricPosition, chordPosition);
      positions.push(chordPosition);
    }
    // If duplicate found at same position, skip it
    // This prevents multiple chords from being displayed at the same position
  }
  
  // Sort positions by position value to maintain order
  positions.sort((a, b) => a.position - b.position);
  
  return positions;
}

// Detect if a line contains only chords (optimized)
function isPureChordLine(line: string): boolean {
  if (!line.trim()) return false;
  
  // Remove chord progression bars |Em D G|
  const cleanLine = line.replace(/^\||\|$/g, '').trim();
  if (!cleanLine) return false;
  
  // Extract potential chords
  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  const matches = cleanLine.match(chordPattern) || [];
  
  if (matches.length === 0) return false;
  
  // Strategy 1: If line is only chords and spaces/punctuation
  const withoutChords = cleanLine.replace(chordPattern, '').replace(/[\s\-\(\),|]/g, '');
  if (withoutChords.length === 0) return true;
  
  // Strategy 2: High chord density
  const totalChordLength = matches.join('').length;
  const lineLength = cleanLine.replace(/\s/g, '').length;
  const chordDensity = totalChordLength / lineLength;
  
  if (chordDensity >= 0.7) return true;
  
  // Strategy 3: Common chord patterns
  const commonPatterns = [
    /^[A-G][#b]?m?\s+[A-G][#b]?m?\s*$/,  // Two spaced chords
    /^[A-G][#b]?m?\s+[A-G][#b]?m?\s+[A-G][#b]?m?\s*$/, // Three spaced chords
    /^([A-G][#b]?m?){2,6}$/, // Concatenated chords like GAm, DEm
  ];
  
  return commonPatterns.some(pattern => pattern.test(cleanLine));
}

// Utility to check if content looks like structured format already
export function isAlreadyStructured(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed.format === 'structured' && Array.isArray(parsed.sections);
  } catch {
    return false;
  }
}