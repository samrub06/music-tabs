import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Chord, ChordData } from '@/types'

function mapDbChordToDomain(dbChord: Database['public']['Tables']['chords']['Row']): Chord {
  const chordData = dbChord.chord_data as unknown as ChordData
  return {
    id: dbChord.id,
    name: dbChord.name,
    chordData: chordData,
    section: dbChord.section,
    tuning: dbChord.tuning,
    difficulty: dbChord.difficulty || null,
    learningOrder: dbChord.learning_order || null,
    createdAt: new Date(dbChord.created_at),
    updatedAt: new Date(dbChord.updated_at)
  }
}

export const chordRepo = (client: SupabaseClient<Database>) => ({
  async getAllChords(): Promise<Chord[]> {
    const { data, error } = await client
      .from('chords')
      .select('*')
      .order('section', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    return (data || []).map(mapDbChordToDomain)
  },

  async searchChords(query: string): Promise<Chord[]> {
    if (!query.trim()) {
      return this.getAllChords()
    }

    const { data, error } = await client
      .from('chords')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('section', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    return (data || []).map(mapDbChordToDomain)
  },

  async getChordsToLearn(userId: string, difficulty?: 'beginner' | 'intermediate' | 'advanced'): Promise<Chord[]> {
    // This will be implemented with userChordAnalysis
    // For now, return all chords filtered by difficulty if specified
    let query = client
      .from('chords')
      .select('*')
      .order('learning_order', { ascending: true, nullsFirst: false })
      .order('section', { ascending: true })
      .order('name', { ascending: true })

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(mapDbChordToDomain)
  }
})

