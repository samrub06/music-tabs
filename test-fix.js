// Test du fix de transposition
const songContent = `[Intro]
A   D   A   E
A   D   A   E

[Couplet 1]
       A                   D
Don't worry      about a thing
          A                      E
'Cause every little thing      gonna be all right`;

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function parseChord(chord) {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  
  return {
    root: match[1],
    quality: match[2] || ''
  };
}

function transposeChord(chord, semitones) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  
  let noteIndex = NOTES.indexOf(parsed.root);
  if (noteIndex === -1) return chord;
  
  let normalizedSemitones = semitones;
  while (normalizedSemitones > 11) normalizedSemitones -= 12;
  while (normalizedSemitones < -11) normalizedSemitones += 12;
  
  let newIndex = (noteIndex + normalizedSemitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES[newIndex] + parsed.quality;
}

function isPartOfWord(match, text, offset) {
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

function transposeText(text, semitones) {
  if (semitones === 0) return text;
  
  // Ultra-robust chord regex - handles ALL chord formats perfectly
  const chordPattern = /(?<![A-Za-z])([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(?![A-Za-z])/g;
  
  return text.replace(chordPattern, (match, chord, offset) => {
    console.log(`🎵 Found chord: "${chord}" at offset ${offset}`);
    console.log(`   Context: "${text.substring(Math.max(0, offset-3), offset)}[${chord}]${text.substring(offset + chord.length, offset + chord.length + 3)}"`);
    
    // Additional validation to avoid false positives in lyrics
    if (isPartOfWord(match, text, offset)) {
      console.log(`   ❌ Skipped (part of word)`);
      return match;
    }
    
    const transposed = transposeChord(chord, semitones);
    console.log(`   ✅ Transposed: ${chord} → ${transposed}\n`);
    return transposed;
  });
}

console.log('=== TRANSPOSITION +2 AVEC DEBUG ===');
const result = transposeText(songContent, 2);
console.log('\n=== RÉSULTAT ===');
console.log(result);
