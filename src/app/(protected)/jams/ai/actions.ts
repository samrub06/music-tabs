'use server'

import { generatePlaylistWithAI } from '@/lib/services/aiPlaylistService'
import { playlistService } from '@/lib/services/playlistService'
import { createActionServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createPlaylistSchema } from '@/lib/validation/schemas'
import { resolvePlaylistImageUrl } from '@/utils/playlistCover'
import { songRepo } from '@/lib/services/songRepo'

const generatePlaylistSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description too long')
})

export async function generatePlaylistWithAIAction(description: string) {
  const { description: validatedDescription } = generatePlaylistSchema.parse({ description })
  return await generatePlaylistWithAI(validatedDescription)
}

export async function createPlaylistWithSongsAction(
  name: string,
  description: string,
  songIds: string[],
  coverSlug?: string
) {
  const { name: validatedName, coverSlug: validatedCoverSlug } = createPlaylistSchema.parse({ name, coverSlug })
  const supabase = await createActionServerClient()
  let songsForCover: { genre?: string }[] | undefined
  if (!validatedCoverSlug && songIds.length > 0) {
    const repo = songRepo(supabase)
    const fetched = await Promise.all(
      songIds.slice(0, 5).map(async (id) => {
        try {
          return await repo.getSong(id)
        } catch {
          return null
        }
      })
    )
    songsForCover = fetched.filter(Boolean) as { genre?: string }[]
  }
  const imageUrl = resolvePlaylistImageUrl({
    name: validatedName,
    coverSlug: validatedCoverSlug,
    songs: songsForCover,
  })
  const playlist = await playlistService.createPlaylist(
    validatedName,
    description,
    songIds,
    supabase,
    imageUrl
  )
  revalidatePath('/jams')
  return playlist
}
