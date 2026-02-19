/**
 * Service pour rechercher des chansons par style musical avec l'IA
 */

import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai'

export interface AISearchResult {
  title: string
  artist: string
  source: 'tab4u' | 'ultimate-guitar'
  genre?: string
  decade?: number
  difficulty?: string
}

export interface AISearchResponse {
  songs: AISearchResult[]
  success: boolean
  error?: string
  preferredSource?: 'tab4u' | 'ultimate-guitar'
}

/**
 * Détecte si une demande fait référence à de la musique juive ou israélienne
 */
async function detectHebrewOrIsraeliRequest(description: string): Promise<boolean> {
  if (!isAIAvailable()) {
    // If AI is not available, return false (no special detection)
    return false
  }

  try {
    const detectionPrompt = `Analyse cette demande de chansons et détermine si elle fait référence à de la musique juive ou israélienne (artistes juifs comme Carlebach, styles hassidiques, chansons en hébreu, artistes israéliens, etc.).

Demande: "${description}"

Réponds UNIQUEMENT par "true" ou "false" (sans guillemets, sans explication).`

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
            content: 'Tu es un expert en musique. Réponds uniquement par "true" ou "false" sans explication.'
          },
          {
            role: 'user',
            content: detectionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content?.trim().toLowerCase()
      return content === 'true'
    }
  } catch (error) {
    console.error('Error in Hebrew detection:', error)
  }

  // If AI call fails, return false (no special detection)
  return false
}

/**
 * Recherche des chansons par style musical avec l'IA
 */
export async function searchSongsByStyle(description: string): Promise<AISearchResponse> {
  try {
    // Vérifier si l'IA est disponible
    if (!isAIAvailable()) {
      return {
        songs: [],
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file'
      }
    }

    if (!description.trim()) {
      return {
        songs: [],
        success: false,
        error: 'Description cannot be empty'
      }
    }

    // Detect if this is a Hebrew/Israeli music request
    const isHebrewRequest = await detectHebrewOrIsraeliRequest(description)
    const preferredSource = isHebrewRequest ? 'tab4u' : 'ultimate-guitar'

    const sourceNote = isHebrewRequest 
      ? 'IMPORTANT: Ces chansons doivent être recherchées sur Tab4U (site israélien). Utilise uniquement des titres et artistes en hébreu ou des chansons israéliennes/juives populaires.'
      : 'Choisis des chansons très populaires et facilement trouvables sur Ultimate Guitar ou Tab4U'

    const prompt = `Tu es un expert en musique. Génère une liste de chansons populaires et bien connues qui correspondent au style musical suivant: "${description}"

Contrainte: retourne AU MAXIMUM 10 à 15 chansons (pas plus de 15).

Règles importantes:
- ${sourceNote}
- Inclus des chansons classiques et reconnues du style demandé
- Assure-toi que les titres et artistes sont exacts et complets
- Varie les artistes (pas seulement un seul artiste)
- Privilégie les chansons qui ont des tabs disponibles en ligne

Retourne UNIQUEMENT un JSON valide avec ce format (sans markdown, sans balises):
{
  "songs": [
    {"title": "Titre exact de la chanson", "artist": "Nom exact de l'artiste"},
    {"title": "Autre titre", "artist": "Autre artiste"}
  ]
}

JSON:`

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
            content: 'Tu es un expert en musique spécialisé dans la recherche de chansons. Tu retournes uniquement du JSON valide sans markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Nettoyage du contenu (au cas où il y aurait des balises markdown)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Extraire le JSON
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in OpenAI response')
    }

    const jsonContent = content.substring(firstBrace, lastBrace + 1)
    const parsedData = JSON.parse(jsonContent)

    if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
      throw new Error('Invalid JSON structure from OpenAI - missing songs array')
    }

    const MAX_AI_RESULTS = 15

    // Valider et nettoyer les chansons, ajouter la source, limiter à 15 max
    const validSongs: AISearchResult[] = parsedData.songs
      .slice(0, MAX_AI_RESULTS)
      .filter((song: any) => song.title && song.artist)
      .map((song: any) => ({
        title: String(song.title).trim(),
        artist: String(song.artist).trim(),
        source: preferredSource,
        genre: song.genre || undefined,
        decade: song.decade || undefined,
        difficulty: song.difficulty || undefined
      }))
      .filter((song: AISearchResult) => song.title.length > 0 && song.artist.length > 0)

    if (validSongs.length === 0) {
      throw new Error('No valid songs found in AI response')
    }

    console.log(`🤖 AI search generated ${validSongs.length} songs for style: "${description}" (source: ${preferredSource})`)

    return {
      songs: validSongs,
      success: true,
      preferredSource
    }

  } catch (error) {
    console.error('Error in AI search:', error)
    return {
      songs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
