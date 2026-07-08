import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { AppInvitation, InvitationPreview, InvitationStatus } from '@/types'
import { friendsRepo } from '@/lib/services/friendsRepo'
import { notificationsRepo } from '@/lib/services/notificationsRepo'

type InvitationRow = Database['public']['Tables']['app_invitations']['Row']

function mapDbInvitationToDomain(row: InvitationRow): AppInvitation {
  return {
    id: row.id,
    code: row.code,
    inviterId: row.inviter_id,
    inviteeEmail: row.invitee_email,
    inviterDisplayName: row.inviter_display_name,
    status: row.status as InvitationStatus,
    acceptedByUserId: row.accepted_by_user_id,
    createdAt: new Date(row.created_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('')
}

export const invitationsRepo = (client: SupabaseClient<Database>) => ({
  async getPreview(code: string): Promise<InvitationPreview | null> {
    const { data, error } = await (client.rpc as any)('get_invitation_preview', {
      p_code: code.toUpperCase(),
    })

    if (error) throw error

    const row = (data as Array<{
      code: string
      inviter_name: string
      inviter_avatar_url: string | null
      status: string
    }> | null)?.[0]

    if (!row) return null

    return {
      code: row.code,
      inviterName: row.inviter_name,
      inviterAvatarUrl: row.inviter_avatar_url,
      status: row.status as InvitationStatus,
    }
  },

  async createInvitation(
    inviterId: string,
    inviterDisplayName: string,
    inviteeEmail?: string | null
  ): Promise<AppInvitation> {
    let code = generateInviteCode()
    let attempts = 0

    while (attempts < 5) {
      const { data, error } = await (client.from('app_invitations') as any)
        .insert({
          code,
          inviter_id: inviterId,
          inviter_display_name: inviterDisplayName,
          invitee_email: inviteeEmail ?? null,
          status: 'pending',
        })
        .select('*')
        .single()

      if (!error) {
        return mapDbInvitationToDomain(data as InvitationRow)
      }

      if (error.code === '23505') {
        code = generateInviteCode()
        attempts += 1
        continue
      }

      throw error
    }

    throw new Error('Could not generate a unique invitation code')
  },

  async listByInviter(inviterId: string): Promise<AppInvitation[]> {
    const { data, error } = await client
      .from('app_invitations')
      .select('*')
      .eq('inviter_id', inviterId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return ((data || []) as InvitationRow[]).map(mapDbInvitationToDomain)
  },

  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    const { data: existing, error: fetchError } = await client
      .from('app_invitations')
      .select('id, inviter_id, status')
      .eq('id', invitationId)
      .single()

    if (fetchError) throw fetchError

    const row = existing as Pick<InvitationRow, 'id' | 'inviter_id' | 'status'>
    if (row.inviter_id !== userId || row.status !== 'pending') {
      throw new Error('Not allowed')
    }

    const { error } = await client
      .from('app_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) throw error
  },

  async redeemInvitation(code: string, userId: string): Promise<AppInvitation | null> {
    const normalizedCode = code.toUpperCase()

    const { data: invitationRow, error: fetchError } = await client
      .from('app_invitations')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!invitationRow) return null

    const invitation = mapDbInvitationToDomain(invitationRow as InvitationRow)

    if (invitation.status !== 'pending') {
      return invitation
    }

    if (invitation.inviterId === userId) {
      return invitation
    }

    const { data: updated, error: updateError } = await (client.from('app_invitations') as any)
      .update({
        status: 'accepted',
        accepted_by_user_id: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle()

    if (updateError) throw updateError
    if (!updated) return invitation

    const redeemed = mapDbInvitationToDomain(updated as InvitationRow)
    const friends = friendsRepo(client)
    const notifications = notificationsRepo(client)

    const existing = await friends.findFriendshipBetween(invitation.inviterId, userId)
    if (!existing) {
      await (client.from('friendships') as any).insert({
        requester_id: invitation.inviterId,
        addressee_id: userId,
        status: 'accepted',
      })
    } else if (existing.status !== 'accepted') {
      await (client.from('friendships') as any)
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }

    const { data: joinerProfile } = await (client.from('profiles') as any)
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const joinerName =
      (joinerProfile as { full_name?: string | null; email?: string } | null)?.full_name ||
      (joinerProfile as { full_name?: string | null; email?: string } | null)?.email ||
      'Someone'

    await notifications.createNotification({
      userId: invitation.inviterId,
      actorId: userId,
      type: 'invitation_accepted',
      entityType: 'invitation',
      entityId: invitation.id,
      title: 'Invitation accepted',
      message: `${joinerName} joined TABasco using your invitation`,
    })

    return redeemed
  },
})
