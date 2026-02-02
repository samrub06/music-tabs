'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updatePlaylistOrderSchema = z.object({
  playlistId: z.string().uuid(),
  songIds: z.array(z.string().uuid())
})

export async function updatePlaylistOrderAction(playlistId: string, songIds: string[]) {
  const { playlistId: validatedPlaylistId, songIds: validatedSongIds } = updatePlaylistOrderSchema.parse({
    playlistId,
    songIds
  })
  
  const supabase = await createActionServerClient()
  await playlistRepo(supabase).updatePlaylist(validatedPlaylistId, {
    songIds: validatedSongIds
  })
  
  revalidatePath(`/playlist/${validatedPlaylistId}`)
  revalidatePath('/playlists')
}
