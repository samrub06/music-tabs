'use server'

import { z } from 'zod'
import { createSafeServerClient } from '@/lib/supabase/server'
import { lyricSyncRepo } from '@/lib/services/lyricSyncRepo'
import {
  readLyricSyncFileCache,
  writeLyricSyncFileCache,
} from '@/lib/services/lyricSyncFileCache'
import type { SongLyricSync } from '@/types'

const getSchema = z.object({
  songId: z.string().uuid(),
  youtubeVideoId: z.string().min(6).max(32),
})

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  return (
    e.code === 'PGRST205' ||
    (typeof e.message === 'string' && e.message.includes('song_lyric_syncs'))
  )
}

export async function getLyricSyncAction(input: unknown): Promise<{
  sync: SongLyricSync | null
}> {
  const { songId, youtubeVideoId } = getSchema.parse(input)

  const fileExact = readLyricSyncFileCache(songId, youtubeVideoId)
  if (fileExact?.status === 'ready') return { sync: fileExact }

  try {
    const supabase = await createSafeServerClient()
    const repo = lyricSyncRepo(supabase)
    const sync = await repo.getBySongAndVideo(songId, youtubeVideoId)
    if (sync) return { sync }

    // Fallback: any ready sync for this song (video search may differ slightly)
    const bySong = await repo.getReadyBySongId(songId)
    if (bySong) return { sync: bySong }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
  }

  // File-cache fallback: any ready cache for this songId
  const { readdirSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const dir = join(process.cwd(), 'experiments/lyric-sync/cache')
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (!name.startsWith(`${songId}_`) || !name.endsWith('.json')) continue
      const cached = readLyricSyncFileCache(songId, name.slice(songId.length + 1, -5))
      if (cached?.status === 'ready') return { sync: cached }
    }
  }

  return { sync: fileExact }
}

/**
 * Ensure sync exists for Practice. MVP: returns DB or file-cache row.
 * Precompute via scripts/lyrics-sync/precompute-playlist.ts (writes file cache + DB when migrated).
 */
export async function ensureLyricSyncAction(input: unknown): Promise<{
  sync: SongLyricSync | null
  started: boolean
}> {
  const { songId, youtubeVideoId } = getSchema.parse(input)

  const cached = readLyricSyncFileCache(songId, youtubeVideoId)
  if (cached?.status === 'ready') {
    return { sync: cached, started: false }
  }

  try {
    const supabase = await createSafeServerClient()
    const repo = lyricSyncRepo(supabase)
    const existing = await repo.getBySongAndVideo(songId, youtubeVideoId)
    if (existing?.status === 'ready' || existing?.status === 'pending') {
      return { sync: existing, started: false }
    }

    if (process.env.LYRIC_SYNC_WORKER === '1' && process.env.NODE_ENV === 'development') {
      const pending = await repo.upsertPending(songId, youtubeVideoId)
      writeLyricSyncFileCache({
        songId,
        youtubeVideoId,
        status: 'pending',
        lines: [],
      })
      return { sync: pending, started: true }
    }

    return { sync: existing ?? cached, started: false }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
    return { sync: cached, started: false }
  }
}
