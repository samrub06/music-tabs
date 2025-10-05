/**
 * Service IA pour organiser automatiquement les chansons en dossiers
 */

import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai';

export interface SongForOrganization {
  title: string;
  artist: string;
}

export interface FolderSuggestion {
  name: string;
  description: string;
  songs: SongForOrganization[];
  color: string;
}

export interface OrganizationResult {
  folders: FolderSuggestion[];
  success: boolean;
  error?: string;
}

/**
 * Organise les chansons en dossiers intelligents avec l'IA
 */
export async function organizeSongsIntoFolders(songs: SongForOrganization[]): Promise<OrganizationResult> {
  try {
    // Vérifier si l'IA est disponible
    if (!isAIAvailable()) {
      return {
        folders: [],
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file'
      };
    }

    if (songs.length === 0) {
      return {
        folders: [],
        success: false,
        error: 'No songs to organize'
      };
    }

    const prompt = `Tu es un expert en organisation musicale. Analyse cette liste de chansons et organise-les en dossiers logiques.

Règles importantes:
- Crée 3-8 dossiers maximum
- Organise par artiste, genre, ou thème musical
- Chaque chanson doit être dans exactement un dossier
- Les noms de dossiers doivent être courts et clairs
- Ajoute une description courte pour chaque dossier
- Choisis une couleur appropriée pour chaque dossier

Couleurs disponibles: blue, green, purple, pink, red, yellow, indigo, gray

Liste des chansons:
${songs.map((song, index) => `${index + 1}. "${song.title}" by "${song.artist}"`).join('\n')}

Retourne UNIQUEMENT un JSON valide avec ce format:
{
  "folders": [
    {
      "name": "Nom du dossier",
      "songs": [
        {"title": "Titre", "artist": "Artiste"}
      ],
      "color": "blue"
    }
  ]
}

JSON:`;

    const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en organisation musicale. Tu retournes toujours du JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Extraire le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    if (!parsedData.folders || !Array.isArray(parsedData.folders)) {
      throw new Error('Invalid JSON structure from OpenAI');
    }

    console.log(`🤖 AI organized ${songs.length} songs into ${parsedData.folders.length} folders`);
    
    return {
      folders: parsedData.folders,
      success: true
    };

  } catch (error) {
    console.error('Error in AI folder organization:', error);
    return {
      folders: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Crée des dossiers basiques si l'IA n'est pas disponible
 */
export function createBasicFolders(songs: SongForOrganization[]): FolderSuggestion[] {
  const artistMap = new Map<string, SongForOrganization[]>();
  
  // Grouper par artiste
  songs.forEach(song => {
    const artist = song.artist;
    if (!artistMap.has(artist)) {
      artistMap.set(artist, []);
    }
    artistMap.get(artist)!.push(song);
  });

  // Créer des dossiers par artiste
  const folders: FolderSuggestion[] = [];
  const colors = ['blue', 'green', 'purple', 'pink', 'red', 'yellow', 'indigo', 'gray'];
  
  let colorIndex = 0;
  artistMap.forEach((songs, artist) => {
    folders.push({
      name: artist,
      description: `${songs.length} chanson${songs.length > 1 ? 's' : ''} de ${artist}`,
      songs: songs,
      color: colors[colorIndex % colors.length]
    });
    colorIndex++;
  });

  return folders;
}

/**
 * Organise avec fallback vers l'organisation basique
 */
export async function organizeSongsWithFallback(songs: SongForOrganization[]): Promise<FolderSuggestion[]> {
  try {
    // Essayer d'abord avec l'IA
    const aiResult = await organizeSongsIntoFolders(songs);
    
    if (aiResult.success && aiResult.folders.length > 0) {
      console.log('✅ AI folder organization successful');
      return aiResult.folders;
    }
    
    console.log('⚠️ AI folder organization failed, using basic organization');
    return createBasicFolders(songs);
    
  } catch (error) {
    console.error('Error in folder organization:', error);
    return createBasicFolders(songs);
  }
}
