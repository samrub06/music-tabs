import { createSafeServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import SearchClient from './SearchClient'
import LibrarySections from './LibrarySections'
import { unstable_noStore as noStore } from 'next/cache'

export default async function SearchPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Suspense fallback={<div className="p-4 pt-8 animate-pulse h-14 bg-muted rounded-xl max-w-7xl mx-auto" />}>
      <SearchClient userId={user?.id}>
        <LibrarySections userId={user?.id} />
      </SearchClient>
    </Suspense>
  )
}
