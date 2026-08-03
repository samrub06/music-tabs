import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import { searchFirstEmbeddableTutorial } from '@/lib/services/youtubeService'
import { youtubeCacheRepo } from '@/lib/services/youtubeCacheRepo'
import { buildYoutubeOriginalQuery } from '@/utils/youtubeTutorial'
import { containsHebrew } from '@/utils/rtl'

const PAGE_SIZE = 500
/** Leave headroom for on-demand app searches within the 100 search/day project quota. */
export const DEFAULT_YOUTUBE_CACHE_SEARCH_LIMIT = 25

export type YoutubeCachePrecomputeStats = {
  promotedFromLyricSync: number
  searched: number
  cached: number
  noVideo: number
  failed: number
  quotaHit: boolean
  /** Public/catalog songs still without original cache after this run (approx). */
  stillMissingApprox: number
}

type SongRow = {
  id: string
  title: string
  author: string | null
}

function detectLang(song: SongRow): 'he' | 'en' {
  const blob = `${song.title} ${song.author || ''}`
  return containsHebrew(blob) ? 'he' : 'en'
}

function isQuotaError(message: string): boolean {
  return /429|quota|RATE_LIMIT|RESOURCE_EXHAUSTED/i.test(message)
}

async function loadCachedOriginalSongIds(
  client: SupabaseClient<Database>
): Promise<Set<string>> {
  const ids = new Set<string>()
  let from = 0
  const table = (client as SupabaseClient<any>).from('song_youtube_cache')

  for (;;) {
    const { data, error } = await table
      .select('song_id')
      .eq('mode', 'original')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('song_youtube_cache')) {
        return ids
      }
      throw error
    }

    const rows = (data || []) as Array<{ song_id: string }>
    for (const row of rows) ids.add(row.song_id)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return ids
}

/**
 * Free: copy youtube_video_id from ready lyric syncs into song_youtube_cache.
 * Does not consume YouTube Search quota.
 */
async function promoteReadyLyricSyncs(
  client: SupabaseClient<Database>,
  cachedIds: Set<string>
): Promise<number> {
  const cache = youtubeCacheRepo(client)
  let promoted = 0
  let from = 0

  for (;;) {
    const { data, error } = await (client as SupabaseClient<any>)
      .from('song_lyric_syncs')
      .select('song_id, youtube_video_id')
      .eq('status', 'ready')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('song_lyric_syncs')) {
        return promoted
      }
      throw error
    }

    const rows = (data || []) as Array<{ song_id: string; youtube_video_id: string }>
    for (const row of rows) {
      if (!row.song_id || !row.youtube_video_id) continue
      if (cachedIds.has(row.song_id)) continue

      await cache.upsert({
        songId: row.song_id,
        mode: 'original',
        video: {
          videoId: row.youtube_video_id,
          title: '',
          channelTitle: '',
        },
      })
      cachedIds.add(row.song_id)
      promoted++
    }

    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return promoted
}

async function collectSongsMissingCache(
  client: SupabaseClient<Database>,
  cachedIds: Set<string>,
  limit: number
): Promise<SongRow[]> {
  const songs: SongRow[] = []
  let from = 0

  while (songs.length < limit) {
    const { data, error } = await (client as SupabaseClient<any>)
      .from('songs')
      .select('id, title, author')
      .or('is_public.eq.true,user_id.is.null')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const batch = (data || []) as SongRow[]
    if (batch.length === 0) break

    for (const song of batch) {
      if (cachedIds.has(song.id)) continue
      songs.push(song)
      if (songs.length >= limit) break
    }

    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return songs
}

/**
 * Prefetch embeddable YouTube IDs into song_youtube_cache for public catalog songs.
 * Safe for Vercel cron: YouTube Data API only (no yt-dlp / Whisper).
 */
export async function precomputeYoutubeCacheBatch(
  client: SupabaseClient<Database>,
  opts: { searchLimit?: number } = {}
): Promise<YoutubeCachePrecomputeStats> {
  const searchLimit = opts.searchLimit ?? DEFAULT_YOUTUBE_CACHE_SEARCH_LIMIT
  const cachedIds = await loadCachedOriginalSongIds(client)
  const promotedFromLyricSync = await promoteReadyLyricSyncs(client, cachedIds)
  const songs = await collectSongsMissingCache(client, cachedIds, searchLimit)

  const stats: YoutubeCachePrecomputeStats = {
    promotedFromLyricSync,
    searched: 0,
    cached: 0,
    noVideo: 0,
    failed: 0,
    quotaHit: false,
    stillMissingApprox: 0,
  }

  const cache = youtubeCacheRepo(client)

  for (const song of songs) {
    const lang = detectLang(song)
    const query = buildYoutubeOriginalQuery(song.title, song.author || '', lang)
    stats.searched++

    try {
      const video = await searchFirstEmbeddableTutorial(query, lang)
      if (!video) {
        stats.noVideo++
        continue
      }

      await cache.upsert({
        songId: song.id,
        mode: 'original',
        video,
        query,
      })
      cachedIds.add(song.id)
      stats.cached++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      stats.failed++
      if (isQuotaError(message)) {
        stats.quotaHit = true
        console.warn('YouTube search quota hit — stopping batch early')
        break
      }
      console.error(`YouTube cache precompute failed for ${song.title}:`, message)
    }
  }

  const { count: publicCount, error: countError } = await (client as SupabaseClient<any>)
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .or('is_public.eq.true,user_id.is.null')
  if (countError) throw countError

  stats.stillMissingApprox = Math.max(0, (publicCount ?? 0) - cachedIds.size)
  return stats
}
