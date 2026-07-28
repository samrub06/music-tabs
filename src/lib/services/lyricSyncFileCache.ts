import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { LyricSyncLine, LyricSyncStatus, SongLyricSync } from '@/types'

const CACHE_DIR = path.join(process.cwd(), 'experiments/lyric-sync/cache')

function cachePath(songId: string, youtubeVideoId: string) {
  return path.join(CACHE_DIR, `${songId}_${youtubeVideoId}.json`)
}

export function readLyricSyncFileCache(
  songId: string,
  youtubeVideoId: string
): SongLyricSync | null {
  const file = cachePath(songId, youtubeVideoId)
  if (!existsSync(file)) return null
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as SongLyricSync & {
      createdAt: string
      updatedAt: string
    }
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    }
  } catch {
    return null
  }
}

export function writeLyricSyncFileCache(sync: {
  songId: string
  youtubeVideoId: string
  status: LyricSyncStatus
  lines: LyricSyncLine[]
  model?: string
  error?: string
}): SongLyricSync {
  mkdirSync(CACHE_DIR, { recursive: true })
  const now = new Date()
  const payload: SongLyricSync = {
    id: `file-${sync.songId}-${sync.youtubeVideoId}`,
    songId: sync.songId,
    youtubeVideoId: sync.youtubeVideoId,
    status: sync.status,
    lines: sync.lines,
    model: sync.model,
    error: sync.error,
    createdAt: now,
    updatedAt: now,
  }
  writeFileSync(cachePath(sync.songId, sync.youtubeVideoId), JSON.stringify(payload, null, 2), 'utf8')
  return payload
}
