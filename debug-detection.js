// Test de détection d'accords
const testLines = [
  'GAm',
  'DEm', 
  'DG',
  'GGG',
  'G# C# C# D#',
  'Em',
  'D',
  'G'
];

// Regex actuelle
const currentRegex = /(?<![A-Za-z])([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(?![A-Za-z])/g;

// Nouvelle regex pour détecter les accords concatenés
const newRegex = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;

console.log('=== TEST DÉTECTION ACCORDS ===\n');

testLines.forEach(line => {
  console.log(`📝 Ligne: "${line}"`);
  
  // Test regex actuelle
  const currentMatches = [...line.matchAll(currentRegex)];
  console.log(`   Regex actuelle: [${currentMatches.map(m => `"${m[1]}"`).join(', ')}]`);
  
  // Test nouvelle regex
  const newMatches = [...line.matchAll(newRegex)];
  console.log(`   Nouvelle regex: [${newMatches.map(m => `"${m[1]}"`).join(', ')}]`);
  
  console.log('');
});

// Test transposition avec la nouvelle détection
function transposeChord(chord, semitones) {
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  const root = match[1];
  const quality = match[2] || '';
  
  let noteIndex = NOTES.indexOf(root);
  if (noteIndex === -1) return chord;
  
  let newIndex = (noteIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES[newIndex] + quality;
}

function transposeTextNew(text, semitones) {
  if (semitones === 0) return text;
  
  // Nouvelle regex plus agressive pour capturer tous les accords
  const chordPattern = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;
  
  return text.replace(chordPattern, (match, chord) => {
    return transposeChord(chord, semitones);
  });
}

console.log('\n=== TEST TRANSPOSITION ===');
const testTranspose = 'GAm\nDEm\nDG\nGGG';
console.log(`Original: "${testTranspose}"`);
console.log(`+1: "${transposeTextNew(testTranspose, 1)}"`);
