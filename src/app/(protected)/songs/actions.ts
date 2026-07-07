'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { songService } from '@/lib/services/songService'
import { userSongsListQuerySchema } from '@/lib/validation/schemas'
import type { Song } from '@/types'

export async function fetchUserSongsListAction(
  payload: unknown
): Promise<{ songs: Song[]; total: number }> {
  const params = userSongsListQuerySchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const orderBy =
    params.tab === 'recent'
      ? 'updated_at'
      : params.tab === 'popular'
        ? 'view_count'
        : 'created_at'

  const folderId =
    params.folder === 'unorganized' ? 'unorganized' : params.folder

  return songService.getAllSongs(
    supabase,
    params.page,
    params.limit,
    params.searchQuery,
    orderBy,
    params.easyChord,
    params.capo,
    params.likedOnly,
    folderId,
    user.id
  )
}
