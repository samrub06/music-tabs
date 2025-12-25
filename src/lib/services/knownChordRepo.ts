import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export const knownChordRepo = (client: SupabaseClient<Database>) => ({
  async getKnownChordIds(userId: string): Promise<string[]> {
    const { data, error } = await client
      .from('user_known_chords')
      .select('chord_id')
      .eq('user_id', userId)

    if (error) throw error

    return (data || []).map((row: { chord_id: string }) => row.chord_id)
  },

  async markKnown(userId: string, chordId: string): Promise<void> {
    const { error } = await (client
      .from('user_known_chords') as any)
      .insert([{
        user_id: userId,
        chord_id: chordId
      }])

    if (error) throw error
  },

  async unmarkKnown(userId: string, chordId: string): Promise<void> {
    const { error } = await client
      .from('user_known_chords')
      .delete()
      .eq('user_id', userId)
      .eq('chord_id', chordId)

    if (error) throw error
  },

  async isKnown(userId: string, chordId: string): Promise<boolean> {
    const { data, error } = await client
      .from('user_known_chords')
      .select('id')
      .eq('user_id', userId)
      .eq('chord_id', chordId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error
    }

    return !!data
  }
})

