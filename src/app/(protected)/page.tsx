import { createSafeServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import SearchClient from './search/SearchClient'
import LibrarySections from './search/LibrarySections'
import ExplorerSectionsSkeleton from '@/components/library/ExplorerSectionsSkeleton'

export default async function HomePage() {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SearchClient userId={user?.id}>
      <Suspense fallback={<ExplorerSectionsSkeleton />}>
        <LibrarySections userId={user?.id} />
      </Suspense>
    </SearchClient>
  )
}
