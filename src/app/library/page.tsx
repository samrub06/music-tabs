import { createSafeServerClient } from '@/lib/supabase/server'
import LibraryClient from './LibraryClient'
import { songRepo } from '@/lib/services/songRepo'

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string }> }) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '24', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''

  // Fetch public/trending songs instead of user's personal songs
  // This replaces the old "Explore" logic
  const { songs, total } = await songRepo(supabase).getTrendingSongsPaged(page, limit, q)

  return (
    <LibraryClient 
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
