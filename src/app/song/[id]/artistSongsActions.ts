'use server'

import { z } from 'zod'
import { createActionServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'

const schema = z.object({
  author: z.string().min(1).max(200),
  excludeSongId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(40).optional(),
})

export type ArtistSongNavItem = {
  id: string
  title: string
  author: string
  songImageUrl?: string
  artistImageUrl?: string
}

export async function fetchArtistSongsForNavAction(
  payload: unknown
): Promise<ArtistSongNavItem[]> {
  const { author, excludeSongId, limit } = schema.parse(payload)
  const supabase = await createActionServerClient()
  const songs = await songRepo(supabase).getPublicSongsByAuthorLightweight(
    author,
    limit ?? 24,
    excludeSongId
  )
  return songs.map((s) => ({
    id: s.id,
    title: s.title,
    author: s.author,
    songImageUrl: s.songImageUrl,
    artistImageUrl: s.artistImageUrl,
  }))
}
