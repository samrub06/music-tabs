import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resendClient'
import { buildInactive14dEmail } from '@/lib/email/templates/inactive14d'
import { emailSendsRepo } from '@/lib/services/emailSendsRepo'
import { PRODUCTION_SITE_URL } from '@/lib/seo/site'
import type { Database } from '@/types/db'

const INACTIVE_DAYS = 14
const BATCH_LIMIT = 50
const LIST_PER_PAGE = 200

export type InactiveUsersEmailStats = {
  scanned: number
  eligible: number
  sent: number
  skipped: number
  errors: number
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || PRODUCTION_SITE_URL
}

function getDisplayName(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): string | null {
  const meta = user.user_metadata
  const fullName = meta?.full_name ?? meta?.name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  return user.email ?? null
}

export async function sendInactiveUsersEmails(
  client: SupabaseClient<Database>
): Promise<InactiveUsersEmailStats> {
  const sends = emailSendsRepo(client)
  const cutoffMs = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000
  const siteUrl = getSiteUrl()

  const stats: InactiveUsersEmailStats = {
    scanned: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  }

  let page = 1
  let hasMore = true

  while (hasMore && stats.sent < BATCH_LIMIT) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: LIST_PER_PAGE,
    })

    if (error) throw error

    const users = data.users ?? []
    if (users.length === 0) break

    for (const user of users) {
      stats.scanned += 1

      if (stats.sent >= BATCH_LIMIT) break

      const email = user.email?.trim()
      if (!email) {
        stats.skipped += 1
        continue
      }

      const lastActiveIso = user.last_sign_in_at ?? user.created_at
      if (!lastActiveIso) {
        stats.skipped += 1
        continue
      }

      const lastActiveMs = Date.parse(lastActiveIso)
      if (Number.isNaN(lastActiveMs) || lastActiveMs > cutoffMs) {
        stats.skipped += 1
        continue
      }

      stats.eligible += 1

      try {
        const alreadySent = await sends.hasReceivedSince(
          user.id,
          'inactive_14d',
          lastActiveIso
        )
        if (alreadySent) {
          stats.skipped += 1
          continue
        }

        const content = buildInactive14dEmail({
          displayName: getDisplayName(user),
          siteUrl,
        })
        const result = await sendEmail({
          to: email,
          subject: content.subject,
          html: content.html,
        })

        await sends.recordSend({
          userId: user.id,
          campaign: 'inactive_14d',
          resendId: result.id,
        })

        stats.sent += 1
      } catch (err) {
        stats.errors += 1
        console.error(`Failed inactive email for user ${user.id}:`, err)
      }
    }

    hasMore = users.length === LIST_PER_PAGE
    page += 1
  }

  return stats
}
