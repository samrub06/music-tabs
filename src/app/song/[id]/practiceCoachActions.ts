'use server'

import { createActionServerClient, createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'

export async function hasCompletedPracticeCoachAction(): Promise<boolean> {
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  return profileRepo(supabase).hasCompletedPracticeCoach(user.id)
}

export async function completePracticeCoachAction(): Promise<void> {
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await profileRepo(supabase).completePracticeCoach(user.id)
}
