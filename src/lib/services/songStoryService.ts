import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai'
import { songStoryRepo } from '@/lib/services/songStoryRepo'
import { buildSongStoryCanonicalKey } from '@/utils/songStoryKey'
import type { Database } from '@/types/db'
import type { SongStory } from '@/types'

export type SongStoryInput = {
  title: string
  author: string
  tabId?: string | null
  genre?: string
  key?: string
  chordProgression?: string[]
  language: 'en' | 'fr' | 'he'
}

const LANGUAGE_LABELS: Record<SongStoryInput['language'], string> = {
  en: 'English',
  fr: 'French',
  he: 'Hebrew',
}

const MAX_STORY_SENTENCES = 3

function limitSentences(text: string, max: number): string {
  if (max <= 0) return ''
  const matches = text.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g)
  if (!matches) return text.trim()
  return matches
    .slice(0, max)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join(' ')
}

function parseStoryJson(raw: string): SongStory | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SongStory>
    if (
      typeof parsed.anecdotes === 'string' &&
      parsed.anecdotes.trim() &&
      typeof parsed.about === 'string' &&
      parsed.about.trim()
    ) {
      const anecdotes = limitSentences(parsed.anecdotes.trim(), 2)
      const about = limitSentences(parsed.about.trim(), 1)
      const meaning =
        typeof parsed.meaning === 'string' && parsed.meaning.trim()
          ? limitSentences(
              parsed.meaning.trim(),
              Math.max(0, MAX_STORY_SENTENCES - 2 - 1)
            )
          : ''

      return {
        anecdotes,
        about,
        meaning,
        chordsInsight: undefined,
      }
    }
  } catch {
  }
  return null
}

async function generateSongStoryWithAI(
  input: SongStoryInput
): Promise<{ story: SongStory | null; error?: string }> {
  if (!isAIAvailable()) {
    return { story: null, error: 'AI not configured' }
  }

  const prompt = `Song: "${input.title}" by ${input.author}
${input.genre ? `Genre: ${input.genre}` : ''}

Respond ENTIRELY in ${LANGUAGE_LABELS[input.language]}.

Write a brief, factual song story in EXACTLY 3 sentences total:
- "anecdotes": exactly 2 sentences — genesis context + one concrete documented fact (year, album, or behind-the-scenes detail).
- "about": exactly 1 sentence — what the lyrics are about.
- "meaning": always an empty string.

Rules: be specific to this song only; never invent facts; no filler; no chord analysis.

Return ONLY valid JSON:
{
  "anecdotes": "Two sentences.",
  "about": "One sentence.",
  "meaning": ""
}`

  try {
    const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a concise music journalist. You write short, factual song stories in exactly 3 sentences total. You never invent facts or use filler. Always respond with valid JSON only.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        max_tokens: 180,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      return { story: null, error: 'Failed to generate story' }
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    if (!content) {
      return { story: null, error: 'Empty response' }
    }

    const story = parseStoryJson(content)
    return story ? { story } : { story: null, error: 'Invalid response format' }
  } catch (error) {
    console.error('generateSongStoryWithAI error:', error)
    return { story: null, error: 'Failed to generate story' }
  }
}

/** Shared cache: same story for all users, keyed by song + language. */
export async function getOrCreateSongStory(
  client: SupabaseClient<Database>,
  input: SongStoryInput,
  options?: { canGenerate?: boolean }
): Promise<{ story: SongStory | null }> {
  const canonicalKey = buildSongStoryCanonicalKey(input.title, input.author, input.tabId)
  const repo = songStoryRepo(client)

  const existing = await repo.getByCanonicalKeyAndLanguage(canonicalKey, input.language)
  if (existing) {
    return {
      story: {
        anecdotes: existing.anecdotes,
        about: existing.about,
        meaning: existing.meaning,
        chordsInsight: existing.chordsInsight,
      },
    }
  }

  if (!options?.canGenerate) {
    return { story: null }
  }

  const { story: generated } = await generateSongStoryWithAI(input)
  if (!generated) {
    return { story: null }
  }

  const inserted = await repo.insertIfAbsent({
    canonicalKey,
    title: input.title,
    author: input.author,
    language: input.language,
    story: generated,
  })

  if (inserted) {
    return { story: generated }
  }

  const raced = await repo.getByCanonicalKeyAndLanguage(canonicalKey, input.language)
  if (raced) {
    return {
      story: {
        anecdotes: raced.anecdotes,
        about: raced.about,
        meaning: raced.meaning,
        chordsInsight: raced.chordsInsight,
      },
    }
  }

  return { story: generated }
}
