import { createSafeServerClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import SearchClient from './SearchClient'

export default async function SearchPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <SearchClient variant="search" userId={user?.id} />
}
