import type { Chord } from '@/types'
import { chordRepo } from './chordRepo'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/db'

export const chordService = {
  async getAllChords(clientSupabase: SupabaseClient<Database>): Promise<Chord[]> {
    return chordRepo(clientSupabase).getAllChords()
  },

  async searchChords(query: string, clientSupabase: SupabaseClient<Database>): Promise<Chord[]> {
    return chordRepo(clientSupabase).searchChords(query)
  }
}
