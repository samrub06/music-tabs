import { Song } from '@/types';

// Convertir une chanson structurée en texte pour l'édition
export function structuredSongToText(song: Song): string {
  if (!song.sections || song.sections.length === 0) {
    return '';
  }

  let text = '';
  
  for (const section of song.sections) {
    // Ajouter l'en-tête de section
    if (section.name) {
      text += `[${section.name}]\n`;
    }
    
    // Ajouter les lignes de la section
    for (const line of section.lines) {
      switch (line.type) {
        case 'chords_only':
          if (line.chord_line) {
            text += line.chord_line + '\n';
          }
          break;
          
        case 'lyrics_only':
          if (line.lyrics) {
            text += line.lyrics + '\n';
          }
          break;
          
        case 'chord_over_lyrics':
          if (line.lyrics && line.chords && line.chords.length > 0) {
            // Construire la ligne d'accords
            let chordLine = '';
            let currentPos = 0;
            
            for (const chord of line.chords) {
              // Ajouter des espaces pour aligner les accords
              while (currentPos < chord.position) {
                chordLine += ' ';
                currentPos++;
              }
              chordLine += chord.chord;
              currentPos += chord.chord.length;
            }
            
            // Ajouter la ligne d'accords si elle n'est pas vide
            if (chordLine.trim()) {
              text += chordLine + '\n';
            }
            text += line.lyrics + '\n';
          } else if (line.lyrics) {
            text += line.lyrics + '\n';
          }
          break;
      }
    }
    
    // Ajouter une ligne vide entre les sections
    text += '\n';
  }
  
  return text.trim();
}
