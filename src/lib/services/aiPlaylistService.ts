/**
 * Service pour générer des listes de chansons avec l'IA basées sur une description de style
 */

import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai'

export interface AIGeneratedSong {
  title: string
  artist: string
}

export interface AIPlaylistGenerationResult {
  songs: AIGeneratedSong[]
  success: boolean
  error?: string
}

/**
 * Génère une liste de chansons populaires basée sur une description de style musical
 */
export async function generatePlaylistWithAI(description: string): Promise<AIPlaylistGenerationResult> {
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

    const prompt = `Tu es un expert en musique. Génère une liste de 10-15 chansons populaires et bien connues qui correspondent au style musical suivant: "${description}"

Règles importantes:
- Choisis des chansons très populaires et facilement trouvables sur Ultimate Guitar ou Tab4U
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
            content: 'Tu es un expert en musique spécialisé dans la génération de playlists. Tu retournes uniquement du JSON valide sans markdown.'
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

    // Valider et nettoyer les chansons
    const validSongs: AIGeneratedSong[] = parsedData.songs
      .filter((song: any) => song.title && song.artist)
      .map((song: any) => ({
        title: String(song.title).trim(),
        artist: String(song.artist).trim()
      }))
      .filter((song: AIGeneratedSong) => song.title.length > 0 && song.artist.length > 0)

    if (validSongs.length === 0) {
      throw new Error('No valid songs found in AI response')
    }

    console.log(`🤖 AI generated ${validSongs.length} songs for style: "${description}"`)

    return {
      songs: validSongs,
      success: true
    }

  } catch (error) {
    console.error('Error in AI playlist generation:', error)
    return {
      songs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
