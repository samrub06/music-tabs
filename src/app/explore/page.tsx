import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import ExploreClient from './ExploreClient'

export const dynamic = 'force-dynamic'

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string; genre?: string; difficulty?: string; decade?: string }> }) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '24', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''
  const genre = params?.genre || undefined
  const difficulty = params?.difficulty || undefined
  const decade = params?.decade ? parseInt(params.decade, 10) : undefined
  
  const { songs, total } = await songRepo(supabase).getTrendingSongsPaged(page, limit, q, genre, difficulty, decade)

  return (
    <ExploreClient 
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      userId={user?.id}
    />
  )
}

