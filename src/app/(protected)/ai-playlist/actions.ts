'use server'

import { generatePlaylistWithAI } from '@/lib/services/aiPlaylistService'
import { playlistService } from '@/lib/services/playlistService'
import { createActionServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createPlaylistSchema } from '@/lib/validation/schemas'

const generatePlaylistSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description too long')
})

export async function generatePlaylistWithAIAction(description: string) {
  const { description: validatedDescription } = generatePlaylistSchema.parse({ description })
  return await generatePlaylistWithAI(validatedDescription)
}

export async function createPlaylistWithSongsAction(name: string, description: string, songIds: string[]) {
  const { name: validatedName } = createPlaylistSchema.parse({ name })
  const supabase = await createActionServerClient()
  const playlist = await playlistService.createPlaylist(validatedName, description, songIds, supabase)
  revalidatePath('/playlists')
  return playlist
}
