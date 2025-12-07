/**
 * Service AI pour parser et identifier les titres et artistes
 * Utilise l'API OpenAI pour une identification précise
 */

import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai';

export interface AIParsedSong {
  title: string;
  artist: string;
  confidence: number;
}

export interface AIParseResult {
  songs: AIParsedSong[];
  success: boolean;
  error?: string;
}

/**
 * Divise le texte en morceaux plus petits pour éviter les limites de tokens
 */
function chunkText(text: string, linesPerChunk: number = 50): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    if (line.trim().length === 0) continue;
    
    currentChunk.push(line);
    if (currentChunk.length >= linesPerChunk) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks;
}

/**
 * Parse un morceau de texte avec l'IA
 */
async function parseChunkWithAI(text: string): Promise<AIParsedSong[]> {
  const prompt = `Tu es un expert en musique. Analyse ce texte copié depuis une playlist Ultimate Guitar et extrais les titres et artistes des chansons.

Règles importantes:
- Le format est généralement: "Titre - Artiste" ou "Titre par Artiste"
- Parfois il y a des versions comme "(ver 2)" qu'il faut ignorer
- Les dates et types (Chords, Official) ne sont pas des titres
- Retourne UNIQUEMENT du JSON valide, SANS balises markdown (comme \`\`\`json).
- Format attendu:
{
  "songs": [
    {"title": "Titre de la chanson", "artist": "Nom de l'artiste", "confidence": 0.95}
  ]
}

Texte à analyser:
${text}`;

  try {
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
            content: 'Tu es un expert en musique spécialisé dans l\'analyse de playlists. Tu retournes uniquement du JSON valide sans markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Nettoyage du contenu
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in OpenAI response');
    }
    
    const jsonString = content.substring(firstBrace, lastBrace + 1);

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      const errorMessage = (e as Error).message;
      
      // Tentative de récupération si JSON tronqué ou malformé
      if (e instanceof SyntaxError && (
          errorMessage.includes('end of JSON input') || 
          errorMessage.includes("Expected ',' or ']'")
      )) {
        console.log('Attempting to fix truncated JSON...');
        
        // Extraction par regex des objets complets
        // On cherche des motifs {"title": "...", "artist": "...", ...}
        // Cette regex est simpliste mais devrait fonctionner pour le format attendu
        const matches = jsonString.match(/\{[^{}]*"title"[^{}]*"artist"[^{}]*\}/g);
        
        if (matches && matches.length > 0) {
          const validSongs = matches.map((s: string) => {
             try { return JSON.parse(s); } catch { return null; }
          }).filter((s: any) => s !== null);
          
          if (validSongs.length > 0) {
            parsedData = { songs: validSongs };
          } else {
            throw new Error(`Failed to recover JSON: ${errorMessage}`);
          }
        } else {
             // Fallback: essayer de fermer le tableau
             try {
                const fixedJson = jsonString.replace(/,?\s*$/, '') + ']}';
                parsedData = JSON.parse(fixedJson);
             } catch (e2) {
                throw new Error(`Failed to parse JSON even after fix attempt: ${errorMessage}`);
             }
        }
      } else {
         throw new Error(`Failed to parse JSON from OpenAI: ${errorMessage}`);
      }
    }
    
    if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
      throw new Error('Invalid JSON structure from OpenAI: missing "songs" array');
    }

    return parsedData.songs;

  } catch (error) {
    console.error('Error parsing chunk:', error);
    return []; // Retourner un tableau vide en cas d'erreur pour ce chunk, pour ne pas bloquer tout le processus
  }
}

/**
 * Parse le texte de playlist avec l'aide de l'IA (avec gestion des chunks)
 */
export async function parsePlaylistWithAI(text: string): Promise<AIParseResult> {
  try {
    // Vérifier si l'API key OpenAI est configurée
    if (!isAIAvailable()) {
      console.warn('OpenAI API key not configured');
      return {
        songs: [],
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file'
      };
    }

    // Découper le texte en chunks
    const chunks = chunkText(text, 100); // 50 lignes par chunk
    console.log(`🤖 Text split into ${chunks.length} chunks for processing`);

    const allSongs: AIParsedSong[] = [];
    
    // Traiter les chunks en série pour éviter les limites de rate
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🤖 Processing chunk ${i + 1}/${chunks.length}...`);
      const chunkSongs = await parseChunkWithAI(chunks[i]);
      if (chunkSongs.length > 0) {
        allSongs.push(...chunkSongs);
      }
    }

    console.log(`🤖 AI parsed total of ${allSongs.length} songs`);
    
    return {
      songs: allSongs,
      success: allSongs.length > 0
    };

  } catch (error) {
    console.error('Error in AI parsing:', error);
    return {
      songs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


/**
 * Teste le parsing AI avec un exemple
 */
export async function testAIParser(text: string): Promise<void> {
  console.log('🧪 Testing AI parser...');
  console.log('Input length:', text.length);
  
  const result = await parsePlaylistWithAI(text);
  
  if (result.success) {
    console.log('✅ AI parsing result:');
    result.songs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by "${song.artist}" (confidence: ${song.confidence})`);
    });
  } else {
    console.log('❌ AI parsing failed:', result.error);
  }
}
