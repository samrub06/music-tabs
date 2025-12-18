/**
 * Utility functions for parsing and displaying strumming patterns
 */

export interface StrummingPattern {
  part?: string;
  bpm?: number;
  denuminator?: number;
  is_triplet?: number | boolean;
  measures: number[];
}

export interface FormattedPattern {
  part: string;
  bpm?: number;
  denuminator?: number;
  isTriplet: boolean;
  symbols: StrummingSymbol[];
}

export interface StrummingSymbol {
  symbol: string;
  measure: number;
  isAccented: boolean;
  isMuted?: boolean;
}

/**
 * Maps a measure number to its strumming symbol
 */
export function getStrummingSymbol(measure: number): StrummingSymbol {
  // Regular downstroke
  if (measure === 1) {
    return { symbol: '↓', measure, isAccented: false };
  }
  
  // Regular upstroke
  if (measure === 2) {
    return { symbol: '↑', measure, isAccented: false };
  }
  
  // Muted downstroke or palm mute downstroke
  if (measure === 3) {
    return { symbol: '↓', measure, isAccented: false, isMuted: true };
  }
  
  // Muted upstroke or palm mute upstroke
  if (measure === 4) {
    return { symbol: '↑', measure, isAccented: false, isMuted: true };
  }
  
  // Downstroke with accent/emphasis
  if (measure === 101) {
    return { symbol: '↓', measure, isAccented: true };
  }
  
  // Upstroke with accent/emphasis
  if (measure === 201) {
    return { symbol: '↑', measure, isAccented: true };
  }
  
  // Upstroke (possibly muted or different emphasis)
  if (measure === 202) {
    return { symbol: '↑', measure, isAccented: false, isMuted: true };
  }
  
  // Default fallback - treat as regular upstroke
  return { symbol: '↑', measure, isAccented: false };
}

/**
 * Convert an array of measure numbers to strumming symbols
 */
export function parseMeasuresToSymbols(measures: number[]): StrummingSymbol[] {
  return measures.map(measure => getStrummingSymbol(measure));
}

/**
 * Format a complete strumming pattern for display
 */
export function formatStrummingPattern(pattern: StrummingPattern): FormattedPattern {
  const symbols = parseMeasuresToSymbols(pattern.measures);
  const isTriplet = pattern.is_triplet === 1 || pattern.is_triplet === true;
  
  return {
    part: pattern.part || 'Pattern',
    bpm: pattern.bpm,
    denuminator: pattern.denuminator,
    isTriplet,
    symbols
  };
}

/**
 * Parse versionDescription string to extract strumming patterns
 * Handles the formatted text structure from scraperService
 */
export function parseVersionDescription(versionDescription: string): StrummingPattern[] {
  if (!versionDescription || !versionDescription.includes('Strumming Patterns')) {
    return [];
  }
  
  const patterns: StrummingPattern[] = [];
  const lines = versionDescription.split('\n');
  
  let currentPattern: Partial<StrummingPattern> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    // Trim but preserve structure for detection
    const trimmedLine = lines[i].trim();
    const originalLine = lines[i];
    
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }
    
    // Skip header
    if (trimmedLine === 'Strumming Patterns:') {
      continue;
    }
    
    // Detect new pattern (line ending with ':' that's not a property)
    // Examples: "Verse:", "Pre-Chorus:", "Pattern 1:"
    if (trimmedLine.endsWith(':') && 
        !trimmedLine.includes('BPM:') && 
        !trimmedLine.includes('Denominator:') && 
        !trimmedLine.includes('Triplet:') && 
        !trimmedLine.includes('Measures:')) {
      // Save previous pattern if exists
      if (currentPattern && currentPattern.measures && currentPattern.measures.length > 0) {
        patterns.push(currentPattern as StrummingPattern);
      }
      
      // Start new pattern
      const partName = trimmedLine.replace(':', '').trim();
      // Check if it's a generic "Pattern X" or has an actual part name
      const isGenericPattern = /^Pattern\s+\d+$/i.test(partName);
      currentPattern = {
        part: isGenericPattern ? undefined : partName,
        measures: []
      };
      continue;
    }
    
    // Parse pattern properties (handle both indented and non-indented)
    if (currentPattern) {
      // Handle BPM (with or without indentation)
      if (trimmedLine.startsWith('BPM:')) {
        const bpmMatch = trimmedLine.match(/BPM:\s*(\d+)/);
        if (bpmMatch) {
          const bpm = parseInt(bpmMatch[1]);
          if (!isNaN(bpm)) {
            currentPattern.bpm = bpm;
          }
        }
      } 
      // Handle Denominator
      else if (trimmedLine.startsWith('Denominator:')) {
        const denMatch = trimmedLine.match(/Denominator:\s*(\d+)/);
        if (denMatch) {
          const denuminator = parseInt(denMatch[1]);
          if (!isNaN(denuminator)) {
            currentPattern.denuminator = denuminator;
          }
        }
      } 
      // Handle Triplet
      else if (trimmedLine.startsWith('Triplet:')) {
        const tripletMatch = trimmedLine.match(/Triplet:\s*(.+)/i);
        if (tripletMatch) {
          const tripletValue = tripletMatch[1].trim().toLowerCase();
          currentPattern.is_triplet = tripletValue === 'yes' || tripletValue === '1' || tripletValue === 'true';
        }
      } 
      // Handle Measures (may span multiple lines or be on one line)
      else if (trimmedLine.includes('Measures:')) {
        // Extract measures array from string like "[1, 2, 202, ...]" or "Measures: [1, 2, ...]"
        let measuresString = trimmedLine;
        
        // If Measures: is on this line, extract everything after it
        if (trimmedLine.includes('Measures:')) {
          measuresString = trimmedLine.split('Measures:')[1] || '';
        }
        
        // Try to find array pattern
        const arrayMatch = measuresString.match(/\[([^\]]+)\]/);
        if (arrayMatch) {
          const measuresStr = arrayMatch[1];
          const measures = measuresStr
            .split(',')
            .map(m => parseInt(m.trim()))
            .filter(m => !isNaN(m));
          
          if (measures.length > 0) {
            currentPattern.measures = measures;
          }
        }
      }
    }
  }
  
  // Don't forget the last pattern
  if (currentPattern && currentPattern.measures && currentPattern.measures.length > 0) {
    patterns.push(currentPattern as StrummingPattern);
  }
  
  return patterns;
}

/**
 * Group symbols for better readability
 * Groups symbols by denominator (e.g., groups of 16 for denominator 16)
 */
export function groupSymbols(
  symbols: StrummingSymbol[], 
  groupSize: number = 8
): StrummingSymbol[][] {
  const groups: StrummingSymbol[][] = [];
  
  for (let i = 0; i < symbols.length; i += groupSize) {
    groups.push(symbols.slice(i, i + groupSize));
  }
  
  return groups;
}

/**
 * Group symbols by beats (typically 2 symbols per beat for eighth notes)
 * Returns groups of symbols with their beat number
 */
export interface BeatGroup {
  beatNumber: number;
  symbols: StrummingSymbol[];
}

export function groupByBeats(
  symbols: StrummingSymbol[],
  symbolsPerBeat: number = 2
): BeatGroup[] {
  const beats: BeatGroup[] = [];
  
  for (let i = 0; i < symbols.length; i += symbolsPerBeat) {
    const beatNumber = Math.floor(i / symbolsPerBeat) + 1;
    beats.push({
      beatNumber,
      symbols: symbols.slice(i, i + symbolsPerBeat)
    });
  }
  
  return beats;
}

