'use server'

import { revalidatePath } from 'next/cache'
import { createActionServerClient, createSafeServerClient } from '@/lib/supabase/server'
import { invitationsRepo } from '@/lib/services/invitationsRepo'
import { profileRepo } from '@/lib/services/profileRepo'
import type { AppInvitation, InvitationPreview } from '@/types'
import {
  createInvitationSchema,
  completeOnboardingSchema,
  invitationIdSchema,
  redeemInvitationSchema,
} from '@/lib/validation/schemas'

async function getCurrentUserId() {
  const supabase = await createActionServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function getInvitationPreviewAction(code: string): Promise<InvitationPreview | null> {
  const supabase = await createSafeServerClient()
  return invitationsRepo(supabase).getPreview(code)
}

export async function createInvitationAction(payload: unknown): Promise<AppInvitation> {
  const validated = createInvitationSchema.parse(payload ?? {})
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('full_name, email')
    .eq('id', userId)
    .single()

  const inviterDisplayName =
    (profile as { full_name?: string | null; email?: string } | null)?.full_name ||
    (profile as { full_name?: string | null; email?: string } | null)?.email ||
    'A TABasco musician'

  const invitation = await invitationsRepo(supabase).createInvitation(
    userId,
    inviterDisplayName,
    validated.inviteeEmail
  )

  revalidatePath('/friends')
  return invitation
}

export async function getMyInvitationsAction(): Promise<AppInvitation[]> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return []
  return invitationsRepo(supabase).listByInviter(userId)
}

export async function cancelInvitationAction(invitationId: string) {
  const { invitationId: validatedId } = invitationIdSchema.parse({ invitationId })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  await invitationsRepo(supabase).cancelInvitation(validatedId, userId)
  revalidatePath('/friends')
}

export async function redeemInvitationAction(code: string) {
  const { code: validatedCode } = redeemInvitationSchema.parse({ code })
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  const result = await invitationsRepo(supabase).redeemInvitation(validatedCode, userId)
  revalidatePath('/friends')
  return result
}

export async function completeOnboardingAction(payload: unknown) {
  const validated = completeOnboardingSchema.parse(payload ?? {})
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) throw new Error('Unauthorized')

  if (validated.inviteCode) {
    await invitationsRepo(supabase).redeemInvitation(validated.inviteCode, userId)
  }

  const profile = await profileRepo(supabase).completeOnboarding(
    userId,
    validated.preferredInstrument ?? null
  )

  revalidatePath('/')
  revalidatePath('/friends')
  revalidatePath('/onboarding')
  return profile
}

export async function needsOnboardingAction(): Promise<boolean> {
  const { supabase, userId } = await getCurrentUserId()
  if (!userId) return false
  return profileRepo(supabase).needsOnboarding(userId)
}
