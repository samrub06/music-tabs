'use server'

import { getIsAdmin } from '@/lib/services/adminPermissions'
import { createActionServerClient } from '@/lib/supabase/server'

export async function getIsAdminAction(): Promise<boolean> {
  const supabase = await createActionServerClient()
  return getIsAdmin(supabase)
}
