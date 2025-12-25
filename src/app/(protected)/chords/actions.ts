'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { knownChordService } from '@/lib/services/knownChordService'
import { revalidatePath } from 'next/cache'

export async function markChordKnownAction(chordId: string) {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated to mark chords as known')
  }

  try {
    await knownChordService.markKnown(user.id, chordId, supabase)
    revalidatePath('/chords')
    return { success: true }
  } catch (error) {
    console.error('Error marking chord as known:', error)
    throw error
  }
}

export async function unmarkChordKnownAction(chordId: string) {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated to unmark chords as known')
  }

  try {
    await knownChordService.unmarkKnown(user.id, chordId, supabase)
    revalidatePath('/chords')
    return { success: true }
  } catch (error) {
    console.error('Error unmarking chord as known:', error)
    throw error
  }
}

