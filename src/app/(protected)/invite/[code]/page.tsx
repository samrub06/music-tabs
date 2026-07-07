import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { invitationsRepo } from '@/lib/services/invitationsRepo'
import InviteLandingClient from './InviteLandingClient'

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  noStore()
  const { code } = await params
  const supabase = await createSafeServerClient()
  const preview = await invitationsRepo(supabase).getPreview(code)

  return <InviteLandingClient code={code.toUpperCase()} preview={preview} />
}
