import { knownChordRepo } from './knownChordRepo'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/db'

export const knownChordService = {
  async getKnownChordIds(userId: string, clientSupabase: SupabaseClient<Database>): Promise<string[]> {
    return knownChordRepo(clientSupabase).getKnownChordIds(userId)
  },

  async markKnown(userId: string, chordId: string, clientSupabase: SupabaseClient<Database>): Promise<void> {
    return knownChordRepo(clientSupabase).markKnown(userId, chordId)
  },

  async unmarkKnown(userId: string, chordId: string, clientSupabase: SupabaseClient<Database>): Promise<void> {
    return knownChordRepo(clientSupabase).unmarkKnown(userId, chordId)
  },

  async isKnown(userId: string, chordId: string, clientSupabase: SupabaseClient<Database>): Promise<boolean> {
    return knownChordRepo(clientSupabase).isKnown(userId, chordId)
  }
}

