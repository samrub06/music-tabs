import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { trendingService } from '@/lib/services/trendingService'
import { Database } from '@/types/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return await Sentry.withMonitor(
      'update-trending',
      async () => {
        if (!supabaseServiceKey) {
          console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })

        console.log('Starting trending songs update by categories...')
        const stats = await trendingService.updateTrendingDatabaseByCategories(supabase, 15)

        return NextResponse.json({
          success: true,
          message: 'Trending songs updated successfully by categories',
          stats,
        })
      },
      {
        schedule: { type: 'crontab', value: '0 0 * * *' },
        checkinMargin: 5,
        maxRuntime: 30,
        timezone: 'UTC',
      },
    )
  } catch (error) {
    console.error('Cron job failed:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
