import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export type EmailCampaign = 'inactive_14d' | 'item_shared'

export type RecordEmailSendInput = {
  userId: string
  campaign: EmailCampaign
  resendId?: string | null
  entityType?: string | null
  entityId?: string | null
}

export const emailSendsRepo = (client: SupabaseClient<Database>) => ({
  async hasReceivedSince(
    userId: string,
    campaign: EmailCampaign,
    sinceIso: string
  ): Promise<boolean> {
    const { data, error } = await (client.from('email_sends') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('campaign', campaign)
      .gte('sent_at', sinceIso)
      .limit(1)

    if (error) throw error
    return ((data as Array<{ id: string }> | null)?.length ?? 0) > 0
  },

  async recordSend(input: RecordEmailSendInput): Promise<void> {
    const { error } = await (client.from('email_sends') as any).insert({
      user_id: input.userId,
      campaign: input.campaign,
      resend_id: input.resendId ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })

    if (error) throw error
  },
})
