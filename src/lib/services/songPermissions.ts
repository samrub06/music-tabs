import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { Song } from '@/types'
import { profileRepo } from '@/lib/services/profileRepo'
import { songRepo } from '@/lib/services/songRepo'
import { canDeleteSong, canEditSong } from '@/lib/utils/songEditPermissions'

async function getSongForPermissionCheck(
  client: SupabaseClient<Database>,
  songId: string
): Promise<{ song: Song; userId: string }> {
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated')
  }

  const song = await songRepo(client).getSong(songId)
  if (!song) {
    throw new Error('Song not found')
  }

  return { song, userId: user.id }
}

export async function assertCanEditSong(
  client: SupabaseClient<Database>,
  songId: string
): Promise<Song> {
  const { song, userId } = await getSongForPermissionCheck(client, songId)
  const isAdmin = await profileRepo(client).isAdmin(userId)

  if (!canEditSong(song, { userId, isAdmin })) {
    throw new Error('You do not have permission to edit this song')
  }

  return song
}

export async function assertCanDeleteSong(
  client: SupabaseClient<Database>,
  songId: string
): Promise<Song> {
  const { song, userId } = await getSongForPermissionCheck(client, songId)
  const isAdmin = await profileRepo(client).isAdmin(userId)

  if (!canDeleteSong(song, { userId, isAdmin })) {
    throw new Error('You do not have permission to delete this song')
  }

  return song
}
