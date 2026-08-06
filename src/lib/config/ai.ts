/**
 * Configuration pour les services IA
 */

export const AI_CONFIG = {
  // Read at access time so scripts can dotenv.config() before first use
  get OPENAI_API_KEY(): string | undefined {
    return process.env.OPENAI_API_KEY
  },

  // Modèle à utiliser (gpt-4o-mini est plus rapide, moins cher et meilleur contexte que 3.5)
  MODEL: 'gpt-4o-mini',

  // Configuration par défaut
  TEMPERATURE: 0.1,
  MAX_TOKENS: 16000,

  // URLs des APIs
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
}

export const isAIAvailable = (): boolean => {
  return !!process.env.OPENAI_API_KEY?.trim()
}
