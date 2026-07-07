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

function parseStoryJson(raw: string): SongStory | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SongStory>
    if (
      typeof parsed.anecdotes === 'string' &&
      parsed.anecdotes.trim() &&
      typeof parsed.about === 'string' &&
      parsed.about.trim() &&
      typeof parsed.meaning === 'string' &&
      parsed.meaning.trim()
    ) {
      return {
        anecdotes: parsed.anecdotes.trim(),
        about: parsed.about.trim(),
        meaning: parsed.meaning.trim(),
        chordsInsight:
          typeof parsed.chordsInsight === 'string' && parsed.chordsInsight.trim()
            ? parsed.chordsInsight.trim()
            : undefined,
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

  const chordHint =
    input.chordProgression && input.chordProgression.length > 0
      ? input.chordProgression.slice(0, 8).join(' – ')
      : undefined

  const prompt = `Song: "${input.title}" by ${input.author}
${input.genre ? `Genre: ${input.genre}` : ''}
${input.key ? `Key: ${input.key}` : ''}
${chordHint ? `Chord progression (excerpt): ${chordHint}` : ''}

Write like an expert music journalist answering a web search for: "${input.author} ${input.title} song history anecdotes".
Respond ENTIRELY in ${LANGUAGE_LABELS[input.language]}.

GOAL: A rich, factual, vivid answer — NOT a generic music-app blurb.

STRICT RULES:
- The "anecdotes" field is THE MOST IMPORTANT (60–70% of total content).
- Start with GENESIS: the personal/career/era context in which the song was born, and why it mattered for the artist.
- Follow with 3–5 CONCRETE anecdotes. Each should have a short thematic label (e.g. "An anthem of freedom", "The natural look") then specific facts: release year, album name, music-video stories, artistic choices, chart success, real lyric quotes in quotation marks.
- Quote REAL lyrics from this song when they support the point.
- NEVER use hollow phrases like "reflective period", "resonated with audiences", "universal themes", "captures the tension", "recorded in a single take" unless it is a well-documented famous fact.
- NEVER invent facts. If unsure, omit or briefly note uncertainty.
- Be specific to THIS artist and THIS song only.

Return ONLY valid JSON (no markdown wrapper):
{
  "anecdotes": "Multi-paragraph text separated by \\n\\n. Paragraph 1 = genesis (2-3 sentences). Then 3-5 anecdotes with short titles, each 2-3 sentences with precise details.",
  "about": "1-2 sentences: what the lyrics are concretely about",
  "meaning": "1-2 sentences: documented cultural or career impact (charts, era, milestone)",
  "chordsInsight": "1-2 sentences on harmony ONLY if genuinely interesting; otherwise empty string"
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
            content: `You are an expert music journalist specializing in song history and anecdotes (like a high-quality Google/Gemini answer to "[artist] [song] histoire anecdote"). You write with concrete facts, real lyric quotes, genesis context, and memorable behind-the-scenes details. You never produce generic filler or invent undocumented facts. Always respond with valid JSON only.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        max_tokens: 1100,
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
