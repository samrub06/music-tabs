import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  DEFAULT_YOUTUBE_CACHE_SEARCH_LIMIT,
  precomputeYoutubeCacheBatch,
} from '@/lib/services/youtubeCachePrecomputeService'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Prefetch YouTube video IDs into song_youtube_cache for catalog songs.
 * Does NOT run Whisper / yt-dlp (not viable on Vercel).
 *
 * Quota: ~1 search.list per uncached song; default 25/run (project limit 100/day).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return await Sentry.withMonitor(
      'precompute-youtube-cache',
      async () => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }
        if (!process.env.YOUTUBE_API_KEY) {
          return NextResponse.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 503 })
        }

        const url = new URL(request.url)
        const limitRaw = Number(url.searchParams.get('limit') || DEFAULT_YOUTUBE_CACHE_SEARCH_LIMIT)
        const searchLimit =
          Number.isFinite(limitRaw) && limitRaw > 0
            ? Math.min(Math.floor(limitRaw), 50)
            : DEFAULT_YOUTUBE_CACHE_SEARCH_LIMIT

        const supabase = createServiceRoleClient()
        console.log(`Starting YouTube cache precompute (searchLimit=${searchLimit})...`)
        const stats = await precomputeYoutubeCacheBatch(supabase, { searchLimit })

        return NextResponse.json({
          success: true,
          message: stats.quotaHit
            ? 'Stopped early — YouTube Search quota exceeded'
            : 'YouTube cache precompute batch completed',
          stats,
        })
      },
      {
        schedule: { type: 'crontab', value: '0 8 * * *' },
        checkinMargin: 5,
        maxRuntime: 10,
        timezone: 'UTC',
      }
    )
  } catch (error) {
    console.error('YouTube cache precompute cron failed:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
