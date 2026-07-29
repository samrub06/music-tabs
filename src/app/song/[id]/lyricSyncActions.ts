'use server'

import { z } from 'zod'
import { createSafeServerClient } from '@/lib/supabase/server'
import { lyricSyncRepo } from '@/lib/services/lyricSyncRepo'
import { songRepo } from '@/lib/services/songRepo'
import {
  readLyricSyncFileCache,
  writeLyricSyncFileCache,
} from '@/lib/services/lyricSyncFileCache'
import { lyricSyncLookupSongIds } from '@/utils/lyricSyncLookup'
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

async function resolveLookupSongIds(songId: string): Promise<string[]> {
  try {
    const supabase = await createSafeServerClient()
    const song = await songRepo(supabase).getSong(songId)
    return lyricSyncLookupSongIds(songId, song?.clonedFromId)
  } catch {
    return [songId]
  }
}

function readReadyFileCacheForSongIds(
  songIds: string[],
  youtubeVideoId: string
): SongLyricSync | null {
  for (const id of songIds) {
    const exact = readLyricSyncFileCache(id, youtubeVideoId)
    if (exact?.status === 'ready') return exact
  }
  return null
}

async function readAnyReadyFileCacheForSongIds(
  songIds: string[]
): Promise<SongLyricSync | null> {
  const { readdirSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const dir = join(process.cwd(), 'experiments/lyric-sync/cache')
  if (!existsSync(dir)) return null

  for (const songId of songIds) {
    for (const name of readdirSync(dir)) {
      if (!name.startsWith(`${songId}_`) || !name.endsWith('.json')) continue
      const videoId = name.slice(songId.length + 1, -5)
      const cached = readLyricSyncFileCache(songId, videoId)
      if (cached?.status === 'ready') return cached
    }
  }
  return null
}

export async function getLyricSyncAction(input: unknown): Promise<{
  sync: SongLyricSync | null
}> {
  const { songId, youtubeVideoId } = getSchema.parse(input)
  const lookupIds = await resolveLookupSongIds(songId)

  const fileExact = readReadyFileCacheForSongIds(lookupIds, youtubeVideoId)
  if (fileExact) return { sync: fileExact }

  try {
    const supabase = await createSafeServerClient()
    const repo = lyricSyncRepo(supabase)

    for (const id of lookupIds) {
      const sync = await repo.getBySongAndVideo(id, youtubeVideoId)
      if (sync) return { sync }
    }

    for (const id of lookupIds) {
      const bySong = await repo.getReadyBySongId(id)
      if (bySong) return { sync: bySong }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
  }

  const anyFile = await readAnyReadyFileCacheForSongIds(lookupIds)
  if (anyFile) return { sync: anyFile }

  return { sync: readLyricSyncFileCache(songId, youtubeVideoId) }
}

/**
 * Ensure sync exists for Practice. MVP: returns DB or file-cache row.
 * Precompute via scripts/lyrics-sync/precompute-playlist.ts (writes file cache + DB when migrated).
 * Reads follow clonedFromId so personal clones reuse catalog sync.
 */
export async function ensureLyricSyncAction(input: unknown): Promise<{
  sync: SongLyricSync | null
  started: boolean
}> {
  const { songId, youtubeVideoId } = getSchema.parse(input)
  const lookupIds = await resolveLookupSongIds(songId)

  const cachedReady = readReadyFileCacheForSongIds(lookupIds, youtubeVideoId)
  if (cachedReady) {
    return { sync: cachedReady, started: false }
  }

  try {
    const supabase = await createSafeServerClient()
    const repo = lyricSyncRepo(supabase)

    for (const id of lookupIds) {
      const existing = await repo.getBySongAndVideo(id, youtubeVideoId)
      if (existing?.status === 'ready' || existing?.status === 'pending') {
        return { sync: existing, started: false }
      }
    }

    // Only enqueue pending on the personal song id (or catalog if viewing catalog directly)
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

    const fallback =
      (await repo.getBySongAndVideo(songId, youtubeVideoId)) ??
      readLyricSyncFileCache(songId, youtubeVideoId)
    return { sync: fallback, started: false }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
    return {
      sync: readLyricSyncFileCache(songId, youtubeVideoId),
      started: false,
    }
  }
}

const songIdSchema = z.object({
  songId: z.string().uuid(),
})

/** True when this song (or its catalog parent) has a ready lyric sync for Practice. */
export async function hasReadyLyricSyncAction(input: unknown): Promise<{
  available: boolean
}> {
  const { songId } = songIdSchema.parse(input)
  const lookupIds = await resolveLookupSongIds(songId)

  const anyFile = await readAnyReadyFileCacheForSongIds(lookupIds)
  if (anyFile?.status === 'ready') return { available: true }

  try {
    const supabase = await createSafeServerClient()
    const repo = lyricSyncRepo(supabase)
    for (const id of lookupIds) {
      const ready = await repo.getReadyBySongId(id)
      if (ready?.status === 'ready') return { available: true }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
  }

  return { available: false }
}
