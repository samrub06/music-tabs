/**
 * Utility functions for precise text measurement and word wrapping
 * Optimized for chord and lyrics display with responsive design
 */

export interface TextMeasurementOptions {
  fontSize: number;
  fontFamily: string;
  containerWidth: number;
  padding?: number;
}

export interface WrappedLine {
  text: string;
  width: number;
  startIndex: number;
  endIndex: number;
}

export interface WrappedChordLine {
  lyrics: string;
  chords: Array<{ chord: string; position: number }>;
  startPos: number;
  width: number;
}

/**
 * Measure text width using canvas for precise calculations.
 * Returns a fallback estimate when run on the server (SSR) where document is undefined.
 */
export function measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
  if (typeof document === 'undefined') {
    return text.length * fontSize * 0.58;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    return text.length * fontSize * 0.58;
  }
  
  context.font = `${fontSize}px ${fontFamily}`;
  return context.measureText(text).width;
}

/**
 * Get character width for monospace fonts
 */
export function getMonospaceCharWidth(fontSize: number): number {
  return fontSize * 0.58; // Optimized for Monaco/Lucida Console
}

/**
 * Calculate maximum characters that fit in container
 */
export function getMaxCharsPerLine(options: TextMeasurementOptions): number {
  const { fontSize, containerWidth, padding = 20 } = options;
  const availableWidth = Math.max(containerWidth - padding, 200);
  const charWidth = getMonospaceCharWidth(fontSize);
  return Math.floor(availableWidth / charWidth);
}

/**
 * Intelligent word wrapping for lyrics with chord position preservation
 */
export function wrapLyricsWithChords(
  lyrics: string,
  chords: Array<{ chord: string; position: number }>,
  options: TextMeasurementOptions
): WrappedChordLine[] {
  const { fontSize, fontFamily } = options;
  const words = lyrics.split(' ');
  const wrappedLines: WrappedChordLine[] = [];
  
  let currentLine = '';
  let currentStartPos = 0;
  let globalPos = 0;
  let currentChords: Array<{ chord: string; position: number }> = [];
  
  words.forEach((word: string, wordIndex: number) => {
    const spaceNeeded = wordIndex > 0 ? 1 : 0;
    const wordWithSpace = (spaceNeeded ? ' ' : '') + word;
    const testLine = currentLine + wordWithSpace;
    
    // Measure actual text width
    const testWidth = measureTextWidth(testLine, fontSize, fontFamily);
    const maxWidth = (options.containerWidth - (options.padding || 20)) * 0.95; // 95% of available width
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      // Finish current line
      const lineWidth = measureTextWidth(currentLine, fontSize, fontFamily);
      
      wrappedLines.push({
        lyrics: currentLine,
        chords: currentChords.map(c => ({
          chord: c.chord,
          position: c.position - currentStartPos
        })),
        startPos: currentStartPos,
        width: lineWidth
      });
      
      // Start new line
      currentLine = word;
      currentStartPos = globalPos + spaceNeeded;
      currentChords = chords.filter(c => c.position >= globalPos + spaceNeeded);
    } else {
      // Add to current line
      currentLine += wordWithSpace;
      
      // Add chords that belong to this word
      const wordStart = globalPos;
      const wordEnd = globalPos + wordWithSpace.length;
      const wordChords = chords.filter(c => c.position >= wordStart && c.position < wordEnd);
      currentChords.push(...wordChords);
    }
    
    globalPos += wordWithSpace.length;
  });
  
  // Add the last line
  if (currentLine) {
    const lineWidth = measureTextWidth(currentLine, fontSize, fontFamily);
    
    wrappedLines.push({
      lyrics: currentLine,
      chords: currentChords.map(c => ({
        chord: c.chord,
        position: c.position - currentStartPos
      })),
      startPos: currentStartPos,
      width: lineWidth
    });
  }
  
  return wrappedLines;
}

/**
 * Simple word wrapping for text without chords
 */
export function wrapText(text: string, options: TextMeasurementOptions): WrappedLine[] {
  const { fontSize, fontFamily } = options;
  const words = text.split(' ');
  const wrappedLines: WrappedLine[] = [];
  
  let currentLine = '';
  let currentStartIndex = 0;
  
  words.forEach((word: string, wordIndex: number) => {
    const spaceNeeded = wordIndex > 0 ? 1 : 0;
    const wordWithSpace = (spaceNeeded ? ' ' : '') + word;
    const testLine = currentLine + wordWithSpace;
    
    // Measure actual text width
    const testWidth = measureTextWidth(testLine, fontSize, fontFamily);
    const maxWidth = (options.containerWidth - (options.padding || 20)) * 0.95;
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      // Finish current line
      const lineWidth = measureTextWidth(currentLine, fontSize, fontFamily);
      
      wrappedLines.push({
        text: currentLine,
        width: lineWidth,
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentLine.length
      });
      
      // Start new line
      currentLine = word;
      currentStartIndex += currentLine.length + spaceNeeded;
    } else {
      currentLine += wordWithSpace;
    }
  });
  
  // Add the last line
  if (currentLine) {
    const lineWidth = measureTextWidth(currentLine, fontSize, fontFamily);
    
    wrappedLines.push({
      text: currentLine,
      width: lineWidth,
      startIndex: currentStartIndex,
      endIndex: currentStartIndex + currentLine.length
    });
  }
  
  return wrappedLines;
}

/**
 * Responsive font size calculation based on screen size
 */
export function getResponsiveFontSize(
  baseFontSize: number, 
  screenWidth: number,
  minFontSize: number = 10
): number {
  if (screenWidth < 640) {
    // Mobile: ensure minimum readability
    return Math.max(baseFontSize, Math.max(minFontSize, 12));
  } else if (screenWidth < 1024) {
    // Tablet: slightly larger minimum
    return Math.max(baseFontSize, Math.max(minFontSize, 14));
  } else {
    // Desktop: use user's choice
    return Math.max(baseFontSize, minFontSize);
  }
}

/**
 * Calculate optimal line height based on font size
 */
export function getOptimalLineHeight(fontSize: number): number {
  // Optimal line height for monospace fonts with chords
  if (fontSize <= 12) return 1.3;
  if (fontSize <= 16) return 1.4;
  if (fontSize <= 20) return 1.5;
  return 1.6;
}

/**
 * Check if text needs wrapping based on container width
 */
export function needsWrapping(
  text: string,
  options: TextMeasurementOptions
): boolean {
  const textWidth = measureTextWidth(text, options.fontSize, options.fontFamily);
  const maxWidth = (options.containerWidth - (options.padding || 20)) * 0.95;
  return textWidth > maxWidth;
}
