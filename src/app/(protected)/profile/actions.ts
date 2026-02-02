'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import type { Profile } from '@/lib/services/profileRepo'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional()
})

/**
 * Get current user's profile
 */
export async function getProfileAction(): Promise<Profile | null> {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const repo = profileRepo(supabase)
  return await repo.getProfile(user.id)
}

/**
 * Update current user's profile
 */
export async function updateProfileAction(updates: unknown): Promise<Profile> {
  const validatedUpdates = updateProfileSchema.parse(updates)
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated to update profile')
  }
  
  const repo = profileRepo(supabase)
  const updatedProfile = await repo.updateProfile(user.id, validatedUpdates)
  
  revalidatePath('/profile')
  return updatedProfile
}
