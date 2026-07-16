import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendInactiveUsersEmails } from '@/lib/services/inactiveUsersEmailService'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return await Sentry.withMonitor(
      'inactive-users-email',
      async () => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
          console.error('RESEND_API_KEY or RESEND_FROM_EMAIL is not defined')
          return NextResponse.json({ error: 'Email configuration error' }, { status: 500 })
        }

        const supabase = createServiceRoleClient()
        console.log('Starting inactive users email campaign...')
        const stats = await sendInactiveUsersEmails(supabase)

        return NextResponse.json({
          success: true,
          message: 'Inactive users email campaign completed',
          stats,
        })
      },
      {
        schedule: { type: 'crontab', value: '0 10 * * *' },
        checkinMargin: 5,
        maxRuntime: 30,
        timezone: 'UTC',
      },
    )
  } catch (error) {
    console.error('Inactive users cron failed:', error)
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
