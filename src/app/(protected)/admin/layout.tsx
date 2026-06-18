import { assertIsAdmin } from '@/lib/services/adminPermissions'
import { createSafeServerClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  noStore()
  const supabase = await createSafeServerClient()

  try {
    await assertIsAdmin(supabase)
  } catch {
    notFound()
  }

  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
}
