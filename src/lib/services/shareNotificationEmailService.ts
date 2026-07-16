import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resendClient'
import { buildItemSharedEmail } from '@/lib/email/templates/itemShared'
import { emailSendsRepo } from '@/lib/services/emailSendsRepo'
import type { Database } from '@/types/db'

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://tabasco.app'
}

export async function sendItemSharedEmail(
  client: SupabaseClient<Database>,
  input: {
    recipientUserId: string
    ownerName: string
    entityType: 'song' | 'playlist'
    entityId: string
    entityTitle: string
  }
): Promise<void> {
  const { data: recipient, error } = await (client.from('profiles') as any)
    .select('email')
    .eq('id', input.recipientUserId)
    .single()

  if (error) throw error

  const to = (recipient as { email?: string } | null)?.email?.trim()
  if (!to) {
    throw new Error('Recipient has no email')
  }

  const path =
    input.entityType === 'song' ? `/song/${input.entityId}` : `/jams/${input.entityId}`
  const openUrl = `${getSiteUrl()}${path}`

  const content = buildItemSharedEmail({
    ownerName: input.ownerName,
    entityType: input.entityType,
    entityTitle: input.entityTitle,
    openUrl,
  })

  const result = await sendEmail({
    to,
    subject: content.subject,
    html: content.html,
  })

  await emailSendsRepo(client).recordSend({
    userId: input.recipientUserId,
    campaign: 'item_shared',
    resendId: result.id,
    entityType: input.entityType,
    entityId: input.entityId,
  })
}
