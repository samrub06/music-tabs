import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import type { Song } from '@/types'
import { JamLabClient } from './JamLabClient'

export default async function JamLabPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const repo = songRepo(supabase)

  let featured: Song | null = null
  let trending: Song[] = []
  try {
    featured = await repo.getFeaturedCatalogSongLightweight()
  } catch {
    featured = null
  }
  try {
    trending = await repo.getTrendingSongsLightweight()
  } catch {
    trending = []
  }

  const suggestedSong =
    featured ??
    (trending.length > 0
      ? trending[Math.floor(Math.random() * Math.min(trending.length, 8))]
      : null)

  return <JamLabClient suggestedSong={suggestedSong} />
}
