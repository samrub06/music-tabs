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
 * Parse le texte de playlist avec l'aide de l'IA
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
        response_format: { type: "json_object" } // Force JSON output for compatible models
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

    // Nettoyage du contenu : supprimer les blocs markdown ```json ... ```
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Chercher le début et la fin du JSON
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
      // Tentative de récupération si JSON tronqué (simple heuristic)
      if (e instanceof SyntaxError && e.message.includes('end of JSON input')) {
        // Try to close the array and object
        try {
            const fixedJson = jsonString.replace(/,?\s*$/, '') + ']}';
            parsedData = JSON.parse(fixedJson);
        } catch (e2) {
             throw new Error(`Failed to parse JSON even after fix attempt: ${(e as Error).message}`);
        }
      } else {
         throw new Error(`Failed to parse JSON from OpenAI: ${(e as Error).message}`);
      }
    }
    
    if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
      throw new Error('Invalid JSON structure from OpenAI: missing "songs" array');
    }

    console.log(`🤖 AI parsed ${parsedData.songs.length} songs`);
    
    return {
      songs: parsedData.songs,
      success: true
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
  console.log('Input:', text);
  
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
