import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { SongStory } from '@/types'

type SongStoryRow = {
  id: string
  canonical_key: string
  title: string
  author: string
  language: string
  about: string
  meaning: string
  anecdotes: string
  chords_insight: string | null
  created_at: string
  updated_at: string
}

export type SongStoryRecord = SongStory & {
  id: string
  canonicalKey: string
  title: string
  author: string
  language: 'en' | 'fr' | 'he'
}

function mapDbSongStoryToDomain(row: SongStoryRow): SongStoryRecord {
  return {
    id: row.id,
    canonicalKey: row.canonical_key,
    title: row.title,
    author: row.author,
    language: row.language as 'en' | 'fr' | 'he',
    about: row.about,
    meaning: row.meaning,
    anecdotes: row.anecdotes,
    chordsInsight: row.chords_insight ?? undefined,
  }
}

export type SaveSongStoryInput = {
  canonicalKey: string
  title: string
  author: string
  language: 'en' | 'fr' | 'he'
  story: SongStory
}

export const songStoryRepo = (client: SupabaseClient<Database>) => ({
  async getByCanonicalKeyAndLanguage(
    canonicalKey: string,
    language: 'en' | 'fr' | 'he'
  ): Promise<SongStoryRecord | null> {
    const { data, error } = await (client.from('song_stories') as any)
      .select(
        'id, canonical_key, title, author, language, about, meaning, anecdotes, chords_insight, created_at, updated_at'
      )
      .eq('canonical_key', canonicalKey)
      .eq('language', language)
      .maybeSingle()

    if (error) throw error
    return data ? mapDbSongStoryToDomain(data as SongStoryRow) : null
  },

  async insertIfAbsent(input: SaveSongStoryInput): Promise<SongStoryRecord | null> {
    const { data, error } = await (client.from('song_stories') as any)
      .insert({
        canonical_key: input.canonicalKey,
        title: input.title,
        author: input.author,
        language: input.language,
        about: input.story.about,
        meaning: input.story.meaning,
        anecdotes: input.story.anecdotes,
        chords_insight: input.story.chordsInsight ?? null,
      })
      .select(
        'id, canonical_key, title, author, language, about, meaning, anecdotes, chords_insight, created_at, updated_at'
      )
      .maybeSingle()

    if (error) {
      // Unique violation — another request won the race
      if (error.code === '23505') {
        return null
      }
      throw error
    }

    return data ? mapDbSongStoryToDomain(data as SongStoryRow) : null
  },
})
