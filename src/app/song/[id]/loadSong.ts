import { cache } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'

/** Per-request dedupe: metadata + page share one DB round-trip. */
export const getCachedSong = cache(async (id: string): Promise<Song | null> => {
  const supabase = await createSafeServerClient()
  return songRepo(supabase).getSong(id)
})
