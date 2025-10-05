/**
 * Parser pour le texte copié depuis MyTabs Ultimate Guitar
 * Format attendu:
 * - Titre de la chanson
 * - Date d'ajout (Jan 29, 2022)
 * - Type (Chords/Official)
 * - Artiste
 */

export interface ParsedSong {
  title: string;
  artist: string;
  type?: string;
  date?: string;
}

/**
 * Parse le texte copié depuis MyTabs
 * @param text - Le texte brut copié depuis la page MyTabs
 * @returns Array des chansons parsées
 */
export function parseMyTabsText(text: string): ParsedSong[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const songs: ParsedSong[] = [];
  
  // Pattern pour détecter une ligne de chanson
  // Format: "Titre de la chanson" suivi de "Date Type" puis "Artiste"
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Ignorer les lignes vides ou les titres de section
    if (!line || line.includes('Misc Soundtrack') || line.includes('Playlist')) {
      i++;
      continue;
    }
    
    // Vérifier si c'est une ligne de chanson (contient une date)
    const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,\s+\d{4}/);
    
    if (dateMatch) {
      // Cette ligne contient la date et le type
      const parts = line.split('\t');
      const dateType = parts[0] || '';
      const type = parts[1] || '';
      
      // La ligne précédente devrait être le titre
      if (i > 0) {
        const title = lines[i - 1];
        
        // La ligne suivante devrait être l'artiste
        if (i + 1 < lines.length) {
          const artist = lines[i + 1];
          
          // Nettoyer le titre (enlever les versions comme "(ver 2)")
          const cleanTitle = title.replace(/\s*\(ver\s+\d+\)\s*$/, '').trim();
          
          console.log(`🎵 Parsed song: "${cleanTitle}" by "${artist.trim()}"`);
          
          songs.push({
            title: cleanTitle,
            artist: artist.trim(),
            type: type.trim(),
            date: dateType.trim()
          });
        }
      }
      
      i += 2; // Passer l'artiste aussi
    } else {
      i++;
    }
  }
  
  return songs;
}

/**
 * Parse un format alternatif plus simple
 * Format: "Artiste - Titre" ou "Titre - Artiste"
 */
export function parseSimpleFormat(text: string): ParsedSong[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const songs: ParsedSong[] = [];
  
  for (const line of lines) {
    // Ignorer les lignes vides ou les titres de section
    if (!line || line.includes('Misc Soundtrack') || line.includes('Playlist')) {
      continue;
    }
    
    // Chercher le pattern "Artiste - Titre" ou "Titre - Artiste"
    const dashMatch = line.match(/^(.+?)\s*-\s*(.+)$/);
    
    if (dashMatch) {
      const [, part1, part2] = dashMatch;
      
      // Déterminer qui est l'artiste et qui est le titre
      // Généralement, l'artiste est plus court et ne contient pas de parenthèses
      const cleanPart1 = part1.trim();
      const cleanPart2 = part2.trim();
      
      // Si part2 contient des parenthèses (version), c'est probablement le titre
      if (cleanPart2.includes('(') && cleanPart2.includes(')')) {
        const cleanTitle = cleanPart2.replace(/\s*\(ver\s+\d+\)\s*$/, '').trim();
        songs.push({
          title: cleanTitle,
          artist: cleanPart1
        });
      } else {
        // Essayer de deviner en fonction de la longueur
        if (cleanPart1.length < cleanPart2.length) {
          songs.push({
            title: cleanPart2,
            artist: cleanPart1
          });
        } else {
          songs.push({
            title: cleanPart1,
            artist: cleanPart2
          });
        }
      }
    }
  }
  
  return songs;
}

/**
 * Parse automatique qui essaie les deux formats
 */
export function parsePlaylistText(text: string): ParsedSong[] {
  // Essayer d'abord le format MyTabs complet
  const myTabsSongs = parseMyTabsText(text);
  
  if (myTabsSongs.length > 0) {
    return myTabsSongs;
  }
  
  // Fallback vers le format simple
  return parseSimpleFormat(text);
}

/**
 * Valide qu'une chanson parsée est complète
 */
export function isValidSong(song: ParsedSong): boolean {
  return !!(song.title && song.artist && song.title.length > 0 && song.artist.length > 0);
}

/**
 * Nettoie et normalise les données d'une chanson
 */
export function cleanSong(song: ParsedSong): ParsedSong {
  return {
    title: song.title.trim(),
    artist: song.artist.trim(),
    type: song.type?.trim(),
    date: song.date?.trim()
  };
}
