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
- Retourne UNIQUEMENT un JSON valide avec ce format:
{
  "songs": [
    {"title": "Titre de la chanson", "artist": "Nom de l'artiste", "confidence": 0.95}
  ]
}

Texte à analyser:
${text}

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
            content: 'Tu es un expert en musique spécialisé dans l\'analyse de playlists. Tu retournes toujours du JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: AI_CONFIG.MAX_TOKENS
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
    
    if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
      throw new Error('Invalid JSON structure from OpenAI');
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
