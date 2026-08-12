import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_COVER_MIGRATE_LIMIT,
  migrateSongCoversBatch,
} from '@/lib/services/songCoverStorageMigrate'
import type { Database } from '@/types/db'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Migrate a bounded batch of catalog covers from UG/Tab4U/iTunes → Supabase Storage.
 * Resumable: each run skips URLs already on our CDN.
 *
 * ~40 songs / hour → ~5 days for ~4800 remaining. Safe under Vercel timeout.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    return await Sentry.withMonitor(
      'migrate-song-covers',
      async () => {
        const url = new URL(request.url)
        const limitRaw = Number(url.searchParams.get('limit') || DEFAULT_COVER_MIGRATE_LIMIT)
        const limit =
          Number.isFinite(limitRaw) && limitRaw > 0
            ? Math.min(80, Math.floor(limitRaw))
            : DEFAULT_COVER_MIGRATE_LIMIT

        const supabase = createClient<Database>(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const stats = await migrateSongCoversBatch(supabase, supabaseUrl, {
          limit,
          concurrency: 4,
          dryRun: false,
        })

        return NextResponse.json({
          success: true,
          message: stats.done
            ? 'No external covers left to migrate'
            : `Migrated batch of ${stats.ok} covers`,
          stats,
        })
      },
      {
        schedule: { type: 'crontab', value: '0 * * * *' },
        checkinMargin: 10,
        maxRuntime: 5,
        timezone: 'UTC',
      }
    )
  } catch (error) {
    console.error('migrate-song-covers cron failed:', error)
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
