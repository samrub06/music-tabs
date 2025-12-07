/**
 * Configuration pour les services IA
 */

export const AI_CONFIG = {
  // Clé API OpenAI (optionnelle)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Modèle à utiliser (gpt-4o-mini est plus rapide, moins cher et meilleur contexte que 3.5)
  MODEL: 'gpt-4o-mini',
  
  // Configuration par défaut
  TEMPERATURE: 0.1,
  MAX_TOKENS: 20000,
  
  // URLs des APIs
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions'
};

export const isAIAvailable = (): boolean => {
  return !!AI_CONFIG.OPENAI_API_KEY;
};
