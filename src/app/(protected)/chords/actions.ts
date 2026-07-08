'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { knownChordService } from '@/lib/services/knownChordService'
import { songRepo } from '@/lib/services/songRepo'
import { chordProgressionSearchSchema, requestChordSchema } from '@/lib/validation/schemas'
import type { Song } from '@/types'

export async function markChordKnownAction(chordId: string) {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to mark chords as known')
  }

  try {
    await knownChordService.markKnown(user.id, chordId, supabase)
    return { success: true }
  } catch (error) {
    console.error('Error marking chord as known:', error)
    throw error
  }
}

export async function requestChordAction(payload: unknown) {
  const { chordName, instrument } = requestChordSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to request a chord')
  }

  const { error } = await (supabase.from('chord_requests') as any).upsert(
    {
      user_id: user.id,
      chord_name: chordName.trim(),
      instrument,
    },
    { onConflict: 'user_id,chord_name,instrument', ignoreDuplicates: true }
  )

  if (error) {
    console.error('Error saving chord request:', error)
    throw new Error('Failed to save chord request')
  }

  return { success: true }
}

export async function unmarkChordKnownAction(chordId: string) {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to unmark chords as known')
  }

  try {
    await knownChordService.unmarkKnown(user.id, chordId, supabase)
    return { success: true }
  } catch (error) {
    console.error('Error unmarking chord as known:', error)
    throw error
  }
}

export async function findSongsByChordProgressionAction(
  payload: unknown
): Promise<Song[]> {
  const validated = chordProgressionSearchSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to search songs by progression')
  }

  return songRepo(supabase).findSongsByChordProgression(validated.chords, {
    limit: validated.limit ?? 30,
  })
}
