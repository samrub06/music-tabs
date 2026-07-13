'use server'

import { createActionServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updatePlaylistOrderSchema = z.object({
  playlistId: z.string().uuid(),
  songIds: z.array(z.string().uuid())
})

const removeSongFromPlaylistSchema = z.object({
  playlistId: z.string().uuid(),
  songId: z.string().uuid(),
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
  
  revalidatePath(`/jams/${validatedPlaylistId}`)
  revalidatePath('/jams')
}

export async function removeSongFromPlaylistAction(playlistId: string, songId: string) {
  const { playlistId: validatedPlaylistId, songId: validatedSongId } =
    removeSongFromPlaylistSchema.parse({ playlistId, songId })

  const supabase = await createActionServerClient()
  const repo = playlistRepo(supabase)
  const playlist = await repo.getPlaylist(validatedPlaylistId)
  const newSongIds = playlist.songIds.filter((id) => id !== validatedSongId)

  await repo.updatePlaylist(validatedPlaylistId, { songIds: newSongIds })

  revalidatePath(`/jams/${validatedPlaylistId}`)
  revalidatePath('/jams')
}
