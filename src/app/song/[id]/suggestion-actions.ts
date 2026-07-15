'use server'

import { revalidatePath } from 'next/cache'
import { createActionServerClient } from '@/lib/supabase/server'
import { songSuggestionRepo } from '@/lib/services/songSuggestionRepo'
import { songRepo } from '@/lib/services/songRepo'
import { assertIsAdmin } from '@/lib/services/adminPermissions'
import {
  submitSongEditSuggestionSchema,
  reviewSongEditSuggestionSchema,
} from '@/lib/validation/schemas'

export async function submitSongEditSuggestionAction(payload: unknown) {
  const input = submitSongEditSuggestionSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('AUTH_REQUIRED')

  const repo = songRepo(supabase)
  const fromSong = await repo.getSong(input.fromSongId)
  if (!fromSong || fromSong.userId !== user.id) {
    throw new Error('FORBIDDEN')
  }
  if (fromSong.clonedFromId !== input.catalogSongId) {
    throw new Error('INVALID_CATALOG_LINK')
  }

  const suggestion = await songSuggestionRepo(supabase).create({
    catalogSongId: input.catalogSongId,
    fromUserId: user.id,
    fromSongId: input.fromSongId,
    message: input.message,
  })

  revalidatePath('/admin/suggestions')
  return suggestion
}

export async function listPendingSongEditSuggestionsAction() {
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  return songSuggestionRepo(supabase).listPending()
}

export async function reviewSongEditSuggestionAction(payload: unknown) {
  const input = reviewSongEditSuggestionSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('AUTH_REQUIRED')
  await assertIsAdmin(supabase)

  const updated = await songSuggestionRepo(supabase).review(
    input.suggestionId,
    input.status,
    user.id
  )

  revalidatePath('/admin/suggestions')
  return updated
}
