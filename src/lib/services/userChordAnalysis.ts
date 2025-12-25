import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

/**
 * Normalize chord name for comparison
 */
function normalizeChord(chord: string): string {
  if (!chord) return ''
  
  let normalized = chord.trim().toUpperCase()
  
  const enharmonicMap: { [key: string]: string } = {
    'C#': 'DB',
    'D#': 'EB',
    'F#': 'GB',
    'G#': 'AB',
    'A#': 'BB'
  }
  
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat)
      break
    }
  }
  
  return normalized
}

export interface UserChordProgress {
  totalKnown: number
  totalChords: number
  knownByDifficulty: {
    beginner: number
    intermediate: number
    advanced: number
  }
  totalByDifficulty: {
    beginner: number
    intermediate: number
    advanced: number
  }
  progressPercentage: number
}

/**
 * Get all unique chords that the user knows based on their songs
 * @param userId User ID
 * @param supabase Supabase client
 * @returns Set of normalized chord names that the user knows
 */
export async function getUserKnownChords(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<Set<string>> {
  // Get all songs belonging to the user
  const { data: songs, error } = await supabase
    .from('songs')
    .select('all_chords')
    .eq('user_id', userId)
    .not('all_chords', 'is', null)

  if (error) {
    console.error('Error fetching user songs for chord analysis:', error)
    return new Set()
  }

  // Extract all unique chords from all songs
  const knownChords = new Set<string>()
  
  if (songs) {
    for (const song of songs as { all_chords: string[] }[]) {
      if (song.all_chords && Array.isArray(song.all_chords)) {
        for (const chord of song.all_chords) {
          if (typeof chord === 'string' && chord.trim()) {
            // Normalize chord name for consistency
            const normalized = normalizeChord(chord)
            if (normalized) {
              knownChords.add(normalized)
            }
          }
        }
      }
    }
  }

  return knownChords
}

/**
 * Get user's chord learning progress statistics
 * @param userId User ID
 * @param supabase Supabase client
 * @returns Progress statistics
 */
export async function getUserChordProgress(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<UserChordProgress> {
  // Get user's known chords
  const knownChords = await getUserKnownChords(userId, supabase)
  
  // Get all chords from database
  const { data: allChords, error } = await supabase
    .from('chords')
    .select('name, difficulty')

  if (error) {
    console.error('Error fetching chords for progress:', error)
    return {
      totalKnown: 0,
      totalChords: 0,
      knownByDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
      totalByDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
      progressPercentage: 0
    }
  }

  // Count chords by difficulty
  const totalByDifficulty = {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  }
  
  const knownByDifficulty = {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  }

  if (allChords) {
    for (const chord of allChords as { name: string, difficulty: string }[]) {
      const normalized = normalizeChord(chord.name)
      const isKnown = knownChords.has(normalized)
      
      const difficulty = chord.difficulty || 'beginner'
      
      // Count total by difficulty
      if (difficulty === 'beginner') totalByDifficulty.beginner++
      else if (difficulty === 'intermediate') totalByDifficulty.intermediate++
      else if (difficulty === 'advanced') totalByDifficulty.advanced++
      
      // Count known by difficulty
      if (isKnown) {
        if (difficulty === 'beginner') knownByDifficulty.beginner++
        else if (difficulty === 'intermediate') knownByDifficulty.intermediate++
        else if (difficulty === 'advanced') knownByDifficulty.advanced++
      }
    }
  }

  const totalChords = allChords?.length || 0
  const totalKnown = knownChords.size
  const progressPercentage = totalChords > 0 ? Math.round((totalKnown / totalChords) * 100) : 0

  return {
    totalKnown,
    totalChords,
    knownByDifficulty,
    totalByDifficulty,
    progressPercentage
  }
}


