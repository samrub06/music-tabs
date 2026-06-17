import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import { assertIsAdmin } from '@/lib/services/adminPermissions'
import { adminUserListQuerySchema } from '@/lib/validation/schemas'
import AdminUsersClient from './AdminUsersClient'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  noStore()
  const supabase = await createSafeServerClient()

  try {
    await assertIsAdmin(supabase)
  } catch {
    notFound()
  }

  const raw = await searchParams
  const parsed = adminUserListQuerySchema.parse({
    search: typeof raw.search === 'string' ? raw.search : undefined,
    page: raw.page,
    limit: raw.limit,
  })

  const { profiles, total } = await profileRepo(supabase).listProfilesForAdmin({
    search: parsed.search,
    page: parsed.page,
    limit: parsed.limit,
  })

  return (
    <AdminUsersClient
      profiles={profiles}
      total={total}
      page={parsed.page}
      limit={parsed.limit}
      initialSearch={parsed.search}
    />
  )
}
